package com.nexora.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * commoditypriceapi.com's "latest rates" endpoint — third Market Intelligence price source, for
 * materials neither Agmarknet (Indian mandi crops) nor Alpha Vantage (tracked metals/energy/ag
 * futures) cover, e.g. Butter. Same JDK HttpClient / no-new-dependency / keyword-match / TTL-cache
 * conventions as AgmarknetService and MarketDataService.
 *
 * Unlike the other two, this is a paid API with only a time-limited free trial (see Company's
 * commodityPriceApiKey doc comment) — the cache TTL is deliberately generous (12h) to stay well
 * inside the Lite plan's 2000-calls/month budget.
 *
 * The provider's docs advertise a `quote` parameter to denominate a commodity price directly in a
 * chosen currency, but a live test showed it's silently ignored on this plan (still comes back
 * USD) -- discovered because Butter briefly displayed as ~100x too cheap. So this never trusts
 * `quote` alone: it reads metaData's actual quoteCurrency and, whenever that isn't already INR,
 * converts with a genuinely live rate from Frankfurter (ECB-backed, frankfurter.dev) -- free,
 * unauthenticated, no key/signup, so this stays self-contained on the one CommodityPriceAPI key
 * instead of also needing Alpha Vantage's FX lookup. Prices are normalized to per-kg here too,
 * same reasoning and math as MaterialIntelligenceService's Alpha Vantage path: metric tons,
 * hundredweight, and pounds aren't units a small business actually buys raw material in.
 */
@Service
public class CommodityPriceApiService {

    private static final String API_BASE = "https://api.commoditypriceapi.com/v2/rates/latest";
    private static final String FX_BASE = "https://api.frankfurter.dev/v1/latest";
    private static final Duration CACHE_TTL = Duration.ofHours(12);
    private static final Duration FX_CACHE_TTL = Duration.ofHours(12);

    /** kgPerDefaultUnit: how many kg one unit of defaultUnit is (1 metric ton = 1000kg, 1 US
     * hundredweight/cwt = 45.359237kg, 1 lb = 0.453592kg) — always used as the intermediate
     * conversion step. displayUnit/kgPerDisplayUnit is the practical unit a business actually
     * buys this commodity in — "kg" for butter/cheese (kgPerDisplayUnit 1.0, no-op), but "L" for
     * milk (kgPerDisplayUnit 1.03, whole milk's density), since milk is priced and sold by volume
     * everywhere, not weight, even though the futures market backing this feed prices it by cwt. */
    public record CommodityDef(String symbol, String label, String defaultUnit, double kgPerDefaultUnit, String displayUnit, double kgPerDisplayUnit, List<String> keywords) {}

    /** Deliberately narrow — only commodities with no other coverage in this app. Keywords match
     * the commodity itself, not distinct local products (e.g. ghee/paneer are excluded: they're
     * genuinely different commodities from butter/cheese, not just a vernacular name for them, so
     * showing a European wholesale butter price as their "real price" would be misleading rather
     * than helpful). */
    public static final List<CommodityDef> TRACKED_COMMODITIES = List.of(
            new CommodityDef("BUTTER", "Butter", "metric ton", 1000.0, "kg", 1.0, List.of("butter")),
            new CommodityDef("MILK", "Milk", "cwt", 45.359237, "L", 1.03, List.of("milk")),
            new CommodityDef("CHE", "Cheese", "lb", 0.453592, "kg", 1.0, List.of("cheese"))
    );

    /** Price per the commodity's own displayUnit (kg for butter/cheese, litres for milk) — always
     * INR by the time it leaves this service. */
    public record CommodityPrice(double price, String unit) {}

    private record CacheEntry(CommodityPrice price, Instant cachedAt) {}
    private record FxCacheEntry(double rate, Instant cachedAt) {}

    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();
    private final Map<String, FxCacheEntry> fxCache = new ConcurrentHashMap<>();

    /** First keyword-matching commodity, if any — same one-provider-per-material contract as
     * AgmarknetService.matchCommodity. */
    public Optional<CommodityDef> matchCommodity(String materialName) {
        String lower = materialName.toLowerCase();
        return TRACKED_COMMODITIES.stream().filter(def -> def.keywords().stream().anyMatch(lower::contains)).findFirst();
    }

    public Optional<CommodityPrice> fetchLatestPrice(String companyId, CommodityDef def, String apiKey) {
        if (apiKey == null || apiKey.isBlank()) return Optional.empty();

        String cacheKey = companyId + ":" + def.symbol();
        CacheEntry cached = cache.get(cacheKey);
        if (cached != null && Duration.between(cached.cachedAt(), Instant.now()).compareTo(CACHE_TTL) < 0) {
            return Optional.of(cached.price());
        }

        try {
            String url = API_BASE + "?symbols=" + def.symbol() + "&quote=INR";
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .header("x-api-key", apiKey)
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) return cached != null ? Optional.of(cached.price()) : Optional.empty();

            JsonNode root = objectMapper.readTree(response.body());
            if (!root.path("success").asBoolean(false)) return cached != null ? Optional.of(cached.price()) : Optional.empty();

            JsonNode rateNode = root.path("rates").path(def.symbol());
            if (!rateNode.isNumber()) return cached != null ? Optional.of(cached.price()) : Optional.empty();

            double rawRate = rateNode.asDouble();
            if (rawRate <= 0) return cached != null ? Optional.of(cached.price()) : Optional.empty();

            // The provider's docs don't state whether "rates" is a direct per-unit price or an
            // inverted currency-pair-style rate (1 / price) -- this API is modeled on the same
            // "Rates API" family as forex-rate services, which commonly express rates that way.
            // A real price for one metric ton / cwt / lb of butter, milk, or cheese -- in any
            // currency this provider quotes in -- is always many multiples of 1, while an inverted
            // rate would land under 1 -- so a sub-1 value is treated as inverted.
            double pricePerDefaultUnit = rawRate < 1 ? 1.0 / rawRate : rawRate;

            // "quote=INR" above is frequently ignored (confirmed live: still comes back USD on
            // this plan) -- never trust it silently. metaData carries what the provider actually
            // quoted in; convert for real whenever that isn't already INR.
            String actualCurrency = root.path("metaData").path(def.symbol()).path("quoteCurrency").asText("USD");
            if (!"INR".equalsIgnoreCase(actualCurrency)) {
                Optional<Double> fxRate = fetchFxRateToInr(actualCurrency);
                if (fxRate.isEmpty()) return cached != null ? Optional.of(cached.price()) : Optional.empty();
                pricePerDefaultUnit *= fxRate.get();
            }

            double pricePerKg = pricePerDefaultUnit / def.kgPerDefaultUnit();
            double pricePerDisplayUnit = pricePerKg * def.kgPerDisplayUnit();

            CommodityPrice fresh = new CommodityPrice(pricePerDisplayUnit, def.displayUnit());
            cache.put(cacheKey, new CacheEntry(fresh, Instant.now()));
            return Optional.of(fresh);
        } catch (Exception e) {
            return cached != null ? Optional.of(cached.price()) : Optional.empty();
        }
    }

    /** Free, unauthenticated ECB-backed rates (frankfurter.dev) -- deliberately not Alpha
     * Vantage's FX lookup, so a material routed through CommodityPriceAPI never silently depends
     * on a second, unrelated key being configured too. */
    private Optional<Double> fetchFxRateToInr(String fromCurrency) {
        FxCacheEntry cached = fxCache.get(fromCurrency);
        if (cached != null && Duration.between(cached.cachedAt(), Instant.now()).compareTo(FX_CACHE_TTL) < 0) {
            return Optional.of(cached.rate());
        }

        try {
            String url = FX_BASE + "?base=" + fromCurrency + "&symbols=INR";
            HttpRequest request = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(10)).GET().build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) return cached != null ? Optional.of(cached.rate()) : Optional.empty();

            JsonNode rateNode = objectMapper.readTree(response.body()).path("rates").path("INR");
            if (!rateNode.isNumber()) return cached != null ? Optional.of(cached.rate()) : Optional.empty();

            double rate = rateNode.asDouble();
            if (rate <= 0) return cached != null ? Optional.of(cached.rate()) : Optional.empty();

            fxCache.put(fromCurrency, new FxCacheEntry(rate, Instant.now()));
            return Optional.of(rate);
        } catch (Exception e) {
            return cached != null ? Optional.of(cached.rate()) : Optional.empty();
        }
    }
}
