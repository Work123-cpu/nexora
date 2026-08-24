package com.nexora.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * data.gov.in's "Current Daily Price of Various Commodities from Various Markets (Mandi)"
 * dataset — the free Indian agricultural mandi price source. Same JDK HttpClient / no-new-
 * dependency style as MarketDataService, feeding the once-daily scheduled job rather than a live
 * poll (6h cache is generous for that cadence).
 *
 * This is a genuinely flaky free government API: mandi coverage is inconsistent (many mandis
 * don't report daily, gaps of several days are normal), the free api-key quota is soft-throttled
 * with no documented SLA, and commodity names in the dataset are India-vernacular. Every call is
 * best-effort — on any failure this returns Optional.empty(), never throws, and the caller
 * (MaterialIntelligenceService) treats that as "skip today's snapshot," not "downgrade the
 * material's routing" — it retries again on the next scheduled run.
 */
@Service
public class AgmarknetService {

    private static final String API_BASE = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";
    private static final Duration CACHE_TTL = Duration.ofHours(6);
    private static final DateTimeFormatter ARRIVAL_DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public record AgriCommodityDef(String commodityName, List<String> keywords) {}

    /** Keyword-match list in the same spirit as MarketDataService.TRACKED_COMMODITIES — matches
     * a raw material's user-typed name to the vernacular commodity name Agmarknet expects. */
    public static final List<AgriCommodityDef> AGRI_COMMODITIES = List.of(
            new AgriCommodityDef("Wheat", List.of("wheat", "atta", "gehun")),
            new AgriCommodityDef("Rice", List.of("rice", "paddy", "chawal", "basmati")),
            new AgriCommodityDef("Onion", List.of("onion", "pyaz")),
            new AgriCommodityDef("Tomato", List.of("tomato")),
            new AgriCommodityDef("Potato", List.of("potato", "aloo")),
            new AgriCommodityDef("Maize", List.of("maize", "corn")),
            new AgriCommodityDef("Soyabean", List.of("soybean", "soyabean", "soya")),
            new AgriCommodityDef("Cotton", List.of("cotton", "kapas")),
            new AgriCommodityDef("Groundnut", List.of("groundnut", "peanut")),
            new AgriCommodityDef("Mustard", List.of("mustard", "sarson", "rapeseed")),
            new AgriCommodityDef("Gram", List.of("gram", "chickpea", "chana")),
            new AgriCommodityDef("Turmeric", List.of("turmeric", "haldi")),
            new AgriCommodityDef("Chilli", List.of("chilli", "chili", "mirchi")),
            new AgriCommodityDef("Sugarcane", List.of("sugarcane", "sugar cane")),
            new AgriCommodityDef("Banana", List.of("banana")),
            new AgriCommodityDef("Mango", List.of("mango"))
    );

    public record AgriPrice(double modalPrice, String unit, String market, String state, LocalDate arrivalDate) {}

    private record CacheEntry(AgriPrice price, Instant cachedAt) {}

    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    /** First keyword-matching commodity, if any — a raw material name can only route to one. */
    public Optional<AgriCommodityDef> matchCommodity(String materialName) {
        String lower = materialName.toLowerCase();
        return AGRI_COMMODITIES.stream().filter(def -> def.keywords().stream().anyMatch(lower::contains)).findFirst();
    }

    public Optional<AgriPrice> fetchLatestPrice(String companyId, AgriCommodityDef def, String apiKey) {
        if (apiKey == null || apiKey.isBlank()) return Optional.empty();

        String cacheKey = companyId + ":" + def.commodityName();
        CacheEntry cached = cache.get(cacheKey);
        if (cached != null && Duration.between(cached.cachedAt(), Instant.now()).compareTo(CACHE_TTL) < 0) {
            return Optional.of(cached.price());
        }

        try {
            String url = API_BASE
                    + "?api-key=" + URLEncoder.encode(apiKey, StandardCharsets.UTF_8)
                    + "&format=json&limit=20"
                    + "&filters[commodity]=" + URLEncoder.encode(def.commodityName(), StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(15)).GET().build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) return cached != null ? Optional.of(cached.price()) : Optional.empty();

            JsonNode records = objectMapper.readTree(response.body()).path("records");
            if (!records.isArray() || records.isEmpty()) return cached != null ? Optional.of(cached.price()) : Optional.empty();

            JsonNode latest = null;
            LocalDate latestDate = null;
            for (JsonNode record : records) {
                LocalDate arrivalDate = parseDate(record.path("arrival_date").asText(null));
                if (arrivalDate == null) continue;
                if (latestDate == null || arrivalDate.isAfter(latestDate)) {
                    latestDate = arrivalDate;
                    latest = record;
                }
            }
            if (latest == null) return cached != null ? Optional.of(cached.price()) : Optional.empty();

            double modalPrice = Double.parseDouble(latest.path("modal_price").asText("0"));
            if (modalPrice <= 0) return cached != null ? Optional.of(cached.price()) : Optional.empty();

            // Agmarknet reports most commodity prices per quintal (100kg) — a known simplification;
            // callers doing per-kg unit math should divide by 100.
            AgriPrice fresh = new AgriPrice(modalPrice, "quintal", latest.path("market").asText(null),
                    latest.path("state").asText(null), latestDate);
            cache.put(cacheKey, new CacheEntry(fresh, Instant.now()));
            return Optional.of(fresh);
        } catch (Exception e) {
            return cached != null ? Optional.of(cached.price()) : Optional.empty();
        }
    }

    private LocalDate parseDate(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return LocalDate.parse(raw, ARRIVAL_DATE_FORMAT);
        } catch (Exception e) {
            return null;
        }
    }
}
