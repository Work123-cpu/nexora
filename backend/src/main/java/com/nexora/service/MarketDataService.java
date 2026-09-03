package com.nexora.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexora.entity.RawMaterial;
import com.nexora.repository.RawMaterialRepository;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Java port of frontend/src/features/market-intelligence/services/commodityService.ts —
 * TRACKED_COMMODITIES, matchCommodities(), and fetchOne()'s Alpha Vantage call/% change math,
 * so the backend can detect the same significant price moves the frontend already shows and
 * turn them into real persisted notifications (NotificationService.syncMarketImpactAlerts).
 *
 * This is the backend's first outbound HTTP integration — plain java.net.http.HttpClient, no
 * new dependency needed. The 20h in-memory cache mirrors the frontend's own localStorage cache
 * TTL and exists for the same reason: Alpha Vantage's free tier is 25 requests/day.
 */
@Service
public class MarketDataService {

    private static final String API_BASE = "https://www.alphavantage.co/query";
    private static final Duration CACHE_TTL = Duration.ofHours(20);

    /** valueInCents: Alpha Vantage reports COTTON/SUGAR/COFFEE in cents per pound, not dollars per
     * pound like every other tracked commodity -- confirmed against the live API's own "unit"
     * field ("cents per pound" vs. "dollar per metric ton"), not assumed. Dividing by 100 at fetch
     * time keeps `value` in dollars for every commodity, so nothing downstream needs to know about
     * this quirk. */
    public record CommodityDef(String function, String label, String unit, String interval, List<String> keywords, boolean valueInCents) {
        public CommodityDef(String function, String label, String unit, String interval, List<String> keywords) {
            this(function, label, unit, interval, keywords, false);
        }
    }

    public static final List<CommodityDef> TRACKED_COMMODITIES = List.of(
            new CommodityDef("WTI", "Crude Oil (WTI)", "USD / barrel", "daily", List.of("crude oil", "petroleum", "wti")),
            new CommodityDef("BRENT", "Crude Oil (Brent)", "USD / barrel", "daily",
                    List.of("diesel", "fuel", "brent", "plastic", "packaging film", "resin", "polymer")),
            new CommodityDef("NATURAL_GAS", "Natural Gas", "USD / MMBtu", "daily", List.of("natural gas", "lpg", "propane", "gas")),
            new CommodityDef("COPPER", "Copper", "USD / metric ton", "monthly", List.of("copper", "wire", "cable")),
            new CommodityDef("ALUMINUM", "Aluminum", "USD / metric ton", "monthly", List.of("aluminum", "aluminium", "foil")),
            new CommodityDef("WHEAT", "Wheat", "USD / metric ton", "monthly", List.of("wheat", "flour", "atta")),
            new CommodityDef("CORN", "Corn", "USD / metric ton", "monthly", List.of("corn", "maize")),
            new CommodityDef("COTTON", "Cotton", "USD / lb", "monthly", List.of("cotton", "fabric", "textile", "yarn"), true),
            new CommodityDef("SUGAR", "Sugar", "USD / lb", "monthly", List.of("sugar"), true),
            new CommodityDef("COFFEE", "Coffee", "USD / lb", "monthly", List.of("coffee"), true)
    );

    public record MarketMove(CommodityDef def, double value, double changePct, List<String> matchedMaterials) {}

    private record CacheEntry(double value, double changePct, Instant cachedAt) {}

    private record FxCacheEntry(double rate, Instant cachedAt) {}

    private final RawMaterialRepository rawMaterials;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();
    private final Map<String, FxCacheEntry> fxCache = new ConcurrentHashMap<>();

    public MarketDataService(RawMaterialRepository rawMaterials) {
        this.rawMaterials = rawMaterials;
    }

    /** Returns every commodity that matches at least one of this company's raw material names,
     * with its current value/% change — regardless of move size; the caller
     * (NotificationService) decides what counts as significant, same as it already does for
     * inventory/PO/vendor thresholds. Silently returns an empty list if apiKey is blank — "no
     * key configured" is a normal, honest state, not an error. */
    public List<MarketMove> fetchMatchedCommodityMoves(String companyId, String apiKey) {
        if (apiKey == null || apiKey.isBlank()) return List.of();

        List<String> materialNames = rawMaterials.findByCompanyId(companyId).stream().map(RawMaterial::getName).toList();
        List<MarketMove> moves = new ArrayList<>();

        for (CommodityDef def : TRACKED_COMMODITIES) {
            List<String> matched = materialNames.stream()
                    .filter(name -> def.keywords().stream().anyMatch(kw -> name.toLowerCase().contains(kw)))
                    .toList();
            if (matched.isEmpty()) continue;

            CacheEntry entry = fetchWithCache(companyId, def, apiKey);
            if (entry != null) {
                moves.add(new MarketMove(def, entry.value(), entry.changePct(), matched));
            }
        }
        return moves;
    }

    /** Single-commodity lookup for a specific material (as opposed to fetchMatchedCommodityMoves'
     * whole-company sweep) — used by MaterialIntelligenceService's metal/energy routing path. */
    public Optional<MarketMove> fetchCommoditySnapshot(String companyId, CommodityDef def, String apiKey) {
        if (apiKey == null || apiKey.isBlank()) return Optional.empty();
        CacheEntry entry = fetchWithCache(companyId, def, apiKey);
        if (entry == null) return Optional.empty();
        return Optional.of(new MarketMove(def, entry.value(), entry.changePct(), List.of()));
    }

    private CacheEntry fetchWithCache(String companyId, CommodityDef def, String apiKey) {
        String cacheKey = companyId + ":" + def.function();
        CacheEntry cached = cache.get(cacheKey);
        if (cached != null && Duration.between(cached.cachedAt(), Instant.now()).compareTo(CACHE_TTL) < 0) {
            return cached;
        }

        try {
            String url = API_BASE + "?function=" + def.function() + "&interval=" + def.interval() + "&apikey=" + apiKey;
            HttpRequest request = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(10)).GET().build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) return cached;

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode dataNode = root.get("data");
            if (dataNode == null || !dataNode.isArray() || dataNode.isEmpty()) return cached;

            // Alpha Vantage returns newest-first with occasional "." placeholder values for gaps.
            List<Double> values = new ArrayList<>();
            for (JsonNode point : dataNode) {
                String v = point.path("value").asText();
                if (!".".equals(v) && !v.isEmpty()) {
                    double parsed = Double.parseDouble(v);
                    values.add(def.valueInCents() ? parsed / 100.0 : parsed);
                }
                if (values.size() >= 14) break;
            }
            if (values.isEmpty()) return cached;
            Collections.reverse(values);

            double value = values.get(values.size() - 1);
            double prev = values.size() > 1 ? values.get(values.size() - 2) : value;
            double changePct = prev != 0 ? Math.round(((value - prev) / prev) * 10000) / 100.0 : 0;

            CacheEntry fresh = new CacheEntry(value, changePct, Instant.now());
            cache.put(cacheKey, fresh);
            return fresh;
        } catch (Exception e) {
            return cached;
        }
    }

    /** USD-INR conversion for Market Intelligence's metal-price path (Alpha Vantage's global
     * commodity prices are USD-denominated; the feature is India-only) — a genuinely new external
     * call, not a reuse of the commodity-price fetching above. Same company-key/cache pattern. */
    public Optional<Double> fetchUsdToInrRate(String companyId, String apiKey) {
        if (apiKey == null || apiKey.isBlank()) return Optional.empty();

        FxCacheEntry cached = fxCache.get(companyId);
        if (cached != null && Duration.between(cached.cachedAt(), Instant.now()).compareTo(CACHE_TTL) < 0) {
            return Optional.of(cached.rate());
        }

        try {
            String url = API_BASE + "?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=INR&apikey=" + apiKey;
            HttpRequest request = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(10)).GET().build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) return cached != null ? Optional.of(cached.rate()) : Optional.empty();

            JsonNode rateNode = objectMapper.readTree(response.body()).path("Realtime Currency Exchange Rate").path("5. Exchange Rate");
            if (rateNode.isMissingNode()) return cached != null ? Optional.of(cached.rate()) : Optional.empty();

            double rate = Double.parseDouble(rateNode.asText());
            if (rate <= 0) return cached != null ? Optional.of(cached.rate()) : Optional.empty();

            fxCache.put(companyId, new FxCacheEntry(rate, Instant.now()));
            return Optional.of(rate);
        } catch (Exception e) {
            return cached != null ? Optional.of(cached.rate()) : Optional.empty();
        }
    }
}
