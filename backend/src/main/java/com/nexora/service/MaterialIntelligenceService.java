package com.nexora.service;

import com.nexora.dto.MaterialIntelligenceView;
import com.nexora.entity.*;
import com.nexora.repository.CompanyRepository;
import com.nexora.repository.MaterialPriceSnapshotRepository;
import com.nexora.repository.RawMaterialIntelligenceRepository;
import com.nexora.repository.RawMaterialRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Orchestration core for Market Intelligence: classification (LLM, once per material), the
 * deterministic category -> data-source routing (never an LLM decision — see routeDataMode), the
 * daily snapshot refresh, and assembling the read view with lazy backfill so a brand-new
 * material isn't stuck showing nothing until tomorrow's scheduled run.
 */
@Service
public class MaterialIntelligenceService {

    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");

    private final RawMaterialRepository rawMaterials;
    private final RawMaterialIntelligenceRepository intelligenceRepo;
    private final MaterialPriceSnapshotRepository snapshotRepo;
    private final CompanyRepository companies;
    private final AiServiceClient aiServiceClient;
    private final AgmarknetService agmarknet;
    private final MarketDataService marketData;
    private final PriceForecastService forecastService;
    private final double spikeDayPct;

    public MaterialIntelligenceService(
            RawMaterialRepository rawMaterials,
            RawMaterialIntelligenceRepository intelligenceRepo,
            MaterialPriceSnapshotRepository snapshotRepo,
            CompanyRepository companies,
            AiServiceClient aiServiceClient,
            AgmarknetService agmarknet,
            MarketDataService marketData,
            PriceForecastService forecastService,
            @Value("${nexora.market-intelligence.spike-day-pct}") double spikeDayPct
    ) {
        this.rawMaterials = rawMaterials;
        this.intelligenceRepo = intelligenceRepo;
        this.snapshotRepo = snapshotRepo;
        this.companies = companies;
        this.aiServiceClient = aiServiceClient;
        this.agmarknet = agmarknet;
        this.marketData = marketData;
        this.forecastService = forecastService;
        this.spikeDayPct = spikeDayPct;
    }

    /** Fire-and-forget — called right after a raw material is saved so bulk CSV imports aren't
     * slowed down by a Groq round-trip per row. */
    @Async("materialIntelligenceExecutor")
    public void classifyAsync(RawMaterial material) {
        classifySync(material);
    }

    /** Used by classifyAsync, the scheduler's PENDING safety net, and getView's lazy backfill. */
    public void classifySync(RawMaterial material) {
        RawMaterialIntelligence intel = intelligenceRepo.findByRawMaterialId(material.getId()).orElseGet(RawMaterialIntelligence::new);
        intel.setCompanyId(material.getCompanyId());
        intel.setRawMaterialId(material.getId());

        Optional<AiServiceClient.ClassifyResult> result = aiServiceClient.classify(material.getName(), material.getCategory(), material.getUnit());
        if (result.isEmpty()) return; // ai-service down — leave as PENDING, retried on next call

        MaterialCategory category;
        try {
            category = MaterialCategory.fromValue(result.get().category());
        } catch (IllegalArgumentException e) {
            category = MaterialCategory.UNCLASSIFIED;
        }
        String referenceCommodity = result.get().referenceCommodity();

        intel.setCategory(category);
        intel.setReferenceCommodity(referenceCommodity);
        intel.setDataMode(routeDataMode(material.getName(), referenceCommodity));
        intel.setClassifiedAt(Instant.now());
        intelligenceRepo.save(intel);
    }

    /** Deterministic — the LLM only describes what a material IS; this code decides where its
     * price comes from, based on static allow-lists (AgmarknetService's mandi commodities,
     * MarketDataService's tracked metals/energy). Checks both the material's own name and its
     * LLM-identified reference commodity, since "Bismuth Oxide" itself won't match anything but
     * a well-tracked reference commodity might. */
    private DataMode routeDataMode(String materialName, String referenceCommodity) {
        if (agmarknet.matchCommodity(materialName).isPresent()) return DataMode.REAL_PRICE;
        if (referenceCommodity != null && agmarknet.matchCommodity(referenceCommodity).isPresent()) return DataMode.REAL_PRICE;
        if (matchTrackedCommodity(materialName).isPresent()) return DataMode.REAL_PRICE;
        if (referenceCommodity != null && matchTrackedCommodity(referenceCommodity).isPresent()) return DataMode.REAL_PRICE;
        return DataMode.INDICATOR_ONLY;
    }

    private Optional<MarketDataService.CommodityDef> matchTrackedCommodity(String name) {
        String lower = name.toLowerCase();
        return MarketDataService.TRACKED_COMMODITIES.stream()
                .filter(def -> def.keywords().stream().anyMatch(lower::contains))
                .findFirst();
    }

    /** Appends today's snapshot (India time) if one doesn't already exist. A failed real-price
     * fetch this cycle falls through to the AI indicator rather than leaving no data at all —
     * dataMode itself is never downgraded by a fetch failure, so it retries the real source
     * again tomorrow. */
    public void refreshSnapshot(RawMaterial material, RawMaterialIntelligence intel, Company company) {
        refreshSnapshot(material, intel, company, false);
    }

    /** force=true re-fetches even if today's snapshot already exists — e.g. right after the user
     * adds an API key in Settings, so they don't have to wait until tomorrow's scheduled run to
     * see real data instead of yesterday's indicator fallback. */
    public void refreshSnapshot(RawMaterial material, RawMaterialIntelligence intel, Company company, boolean force) {
        LocalDate today = LocalDate.now(INDIA_ZONE);
        Optional<MaterialPriceSnapshot> existing = snapshotRepo.findByRawMaterialIdAndSnapshotDate(material.getId(), today);
        if (existing.isPresent()) {
            if (!force) return;
            snapshotRepo.delete(existing.get());
        }

        if (intel.getDataMode() == DataMode.REAL_PRICE) {
            if (tryAgmarknetSnapshot(material, intel, company, today)) return;
            if (tryMetalSnapshot(material, intel, company, today)) return;
        }
        saveIndicatorSnapshot(material, intel, today);
    }

    /** Manual "Refresh" action from the Market Intelligence page — classifies anything still
     * PENDING, then force-refreshes every material's snapshot for today, regardless of whether
     * one already exists. */
    public List<MaterialIntelligenceView> refreshAll(String companyId) {
        Company company = companies.findById(companyId).orElse(null);
        for (RawMaterial material : rawMaterials.findByCompanyId(companyId)) {
            RawMaterialIntelligence intel = intelligenceRepo.findByRawMaterialId(material.getId()).orElse(null);
            if (intel == null || intel.getDataMode() == DataMode.PENDING) {
                classifySync(material);
                intel = intelligenceRepo.findByRawMaterialId(material.getId()).orElse(null);
            }
            if (intel == null) continue;
            refreshSnapshot(material, intel, company, true);
        }
        return getView(companyId);
    }

    private boolean tryAgmarknetSnapshot(RawMaterial material, RawMaterialIntelligence intel, Company company, LocalDate today) {
        Optional<AgmarknetService.AgriCommodityDef> match = agmarknet.matchCommodity(material.getName());
        if (match.isEmpty() && intel.getReferenceCommodity() != null) match = agmarknet.matchCommodity(intel.getReferenceCommodity());
        if (match.isEmpty()) return false;

        Optional<AgmarknetService.AgriPrice> price = agmarknet.fetchLatestPrice(material.getCompanyId(), match.get(), company != null ? company.getDataGovInApiKey() : null);
        if (price.isEmpty()) return false;

        saveRealSnapshot(material, today, BigDecimal.valueOf(price.get().modalPrice()), price.get().unit(),
                "Agmarknet (Govt. of India mandi prices)", price.get().market());
        return true;
    }

    private boolean tryMetalSnapshot(RawMaterial material, RawMaterialIntelligence intel, Company company, LocalDate today) {
        Optional<MarketDataService.CommodityDef> match = matchTrackedCommodity(material.getName());
        if (match.isEmpty() && intel.getReferenceCommodity() != null) match = matchTrackedCommodity(intel.getReferenceCommodity());
        if (match.isEmpty()) return false;

        String apiKey = company != null ? company.getAlphaVantageApiKey() : null;
        Optional<MarketDataService.MarketMove> move = marketData.fetchCommoditySnapshot(material.getCompanyId(), match.get(), apiKey);
        Optional<Double> fxRate = marketData.fetchUsdToInrRate(material.getCompanyId(), apiKey);
        if (move.isEmpty() || fxRate.isEmpty()) return false;

        double priceInInr = move.get().value() * fxRate.get();
        String unit = match.get().unit().replace("USD", "INR");

        // Alpha Vantage reports mass-based commodities per metric ton or per pound -- neither is a
        // unit a small business actually buys raw material in. Normalize both to per-kg so every
        // material on the page reads in the same practical unit. Volume/energy commodities (oil in
        // USD/barrel, gas in USD/MMBtu) have no sensible mass equivalent, so they're left as-is.
        if (unit.endsWith("/ metric ton")) {
            priceInInr = priceInInr / 1000.0;
            unit = "INR / kg";
        } else if (unit.endsWith("/ lb")) {
            priceInInr = priceInInr * 2.20462; // 1 kg = 2.20462 lb, so price-per-kg = price-per-lb * 2.20462
            unit = "INR / kg";
        }

        saveRealSnapshot(material, today, BigDecimal.valueOf(priceInInr), unit, "Alpha Vantage (global spot, converted to INR)", null);
        return true;
    }

    private void saveRealSnapshot(RawMaterial material, LocalDate date, BigDecimal price, String unit, String source, String market) {
        MaterialPriceSnapshot previous = snapshotRepo.findByRawMaterialIdOrderBySnapshotDateDesc(material.getId()).stream()
                .filter(s -> s.getPrice() != null)
                .findFirst()
                .orElse(null);

        MaterialPriceSnapshot snapshot = new MaterialPriceSnapshot();
        snapshot.setCompanyId(material.getCompanyId());
        snapshot.setRawMaterialId(material.getId());
        snapshot.setSnapshotDate(date);
        snapshot.setPrice(price);
        snapshot.setUnit(unit);
        snapshot.setSource(source);
        snapshot.setMarket(market);
        snapshot.setConfidenceLevel(ConfidenceLevel.HIGH);

        PriceTrend trend = PriceTrend.STABLE;
        boolean spike = false;
        if (previous != null && previous.getPrice() != null && previous.getPrice().doubleValue() != 0) {
            double changePct = ((price.doubleValue() - previous.getPrice().doubleValue()) / previous.getPrice().doubleValue()) * 100;
            trend = changePct > 1.0 ? PriceTrend.RISING : changePct < -1.0 ? PriceTrend.FALLING : PriceTrend.STABLE;
            spike = Math.abs(changePct) >= spikeDayPct;
        }
        snapshot.setTrend(trend);
        snapshot.setSpike(spike);
        snapshotRepo.save(snapshot);
    }

    private void saveIndicatorSnapshot(RawMaterial material, RawMaterialIntelligence intel, LocalDate today) {
        String previousTrend = snapshotRepo.findByRawMaterialIdOrderBySnapshotDateDesc(material.getId()).stream()
                .findFirst()
                .map(s -> s.getTrend().getValue())
                .orElse(null);

        Optional<AiServiceClient.IndicatorResult> indicator = aiServiceClient.indicator(
                material.getName(), intel.getCategory().getValue(), intel.getReferenceCommodity(), previousTrend);
        if (indicator.isEmpty()) return; // ai-service down — skip today's snapshot, retry tomorrow

        MaterialPriceSnapshot snapshot = new MaterialPriceSnapshot();
        snapshot.setCompanyId(material.getCompanyId());
        snapshot.setRawMaterialId(material.getId());
        snapshot.setSnapshotDate(today);
        snapshot.setSource("AI market reasoning — no standardized price feed for this material");
        snapshot.setTrend(safeTrend(indicator.get().trend()));
        snapshot.setConfidenceLevel(safeIndicatorConfidence(indicator.get().confidence()));
        snapshot.setSpike(false);
        snapshotRepo.save(snapshot);
    }

    private PriceTrend safeTrend(String value) {
        try {
            return PriceTrend.fromValue(value);
        } catch (Exception e) {
            return PriceTrend.STABLE;
        }
    }

    private ConfidenceLevel safeIndicatorConfidence(String value) {
        try {
            ConfidenceLevel level = ConfidenceLevel.fromValue(value);
            // Defense-in-depth, mirrors ai-service's own clamp — an indicator-only reading must
            // never surface as HIGH confidence even if something upstream slipped through.
            return level == ConfidenceLevel.HIGH ? ConfidenceLevel.MEDIUM : level;
        } catch (Exception e) {
            return ConfidenceLevel.LOW;
        }
    }

    public List<MaterialIntelligenceView> getView(String companyId) {
        Company company = companies.findById(companyId).orElse(null);
        List<MaterialIntelligenceView> views = new ArrayList<>();

        for (RawMaterial material : rawMaterials.findByCompanyId(companyId)) {
            RawMaterialIntelligence intel = intelligenceRepo.findByRawMaterialId(material.getId()).orElse(null);
            if (intel == null || intel.getDataMode() == DataMode.PENDING) {
                classifySync(material);
                intel = intelligenceRepo.findByRawMaterialId(material.getId()).orElse(null);
            }
            if (intel == null) continue; // classification still failing (ai-service down) — retry on next read

            List<MaterialPriceSnapshot> history = snapshotRepo.findTop30ByRawMaterialIdOrderBySnapshotDateDesc(material.getId());
            if (history.isEmpty()) {
                refreshSnapshot(material, intel, company);
                history = snapshotRepo.findTop30ByRawMaterialIdOrderBySnapshotDateDesc(material.getId());
            }

            views.add(buildView(material, intel, history));
        }
        return views;
    }

    private MaterialIntelligenceView buildView(RawMaterial material, RawMaterialIntelligence intel, List<MaterialPriceSnapshot> historyDesc) {
        if (historyDesc.isEmpty()) {
            boolean pendingIsEstimate = intel.getDataMode() == DataMode.INDICATOR_ONLY;
            return new MaterialIntelligenceView(material.getId(), material.getName(), intel.getCategory().getValue(),
                    intel.getDataMode().getValue(), null, null, null, null, null, null, null, null, null, null, null, pendingIsEstimate);
        }

        MaterialPriceSnapshot latest = historyDesc.get(0);
        // Reflects TODAY's actual reading, not just the structural routing — a REAL_PRICE
        // material whose fetch failed this cycle (no key configured, source down) is honestly
        // labeled an estimate too, not silently shown as if it were real data.
        boolean isEstimate = latest.getPrice() == null;
        MaterialIntelligenceView.ForecastView forecastView = null;
        if (intel.getDataMode() == DataMode.REAL_PRICE) {
            List<MaterialPriceSnapshot> fullHistory = snapshotRepo.findByRawMaterialIdOrderBySnapshotDateDesc(material.getId());
            Optional<PriceForecastService.Forecast> forecast = forecastService.forecast(fullHistory);
            if (forecast.isPresent()) {
                PriceForecastService.Forecast f = forecast.get();
                forecastView = new MaterialIntelligenceView.ForecastView(f.projectedPrice(), f.lowerBound(), f.upperBound(), f.horizonDays(), f.confidenceScore());
            }
        }

        return new MaterialIntelligenceView(
                material.getId(), material.getName(), intel.getCategory().getValue(), intel.getDataMode().getValue(),
                latest.getPrice(), latest.getUnit(), latest.getSource(), latest.getMarket(),
                computeChangePct(historyDesc, 1), computeChangePct(historyDesc, 7), computeChangePct(historyDesc, 30),
                latest.getTrend().getValue(), latest.getConfidenceLevel().getValue(),
                forecastView, latest.getSnapshotDate().toString(), isEstimate
        );
    }

    /** Null (never a fabricated %) until a real snapshot from at least that many days back has
     * actually accumulated — no synthetic backfill. */
    private Double computeChangePct(List<MaterialPriceSnapshot> historyDesc, int daysAgo) {
        MaterialPriceSnapshot latest = historyDesc.get(0);
        if (latest.getPrice() == null) return null;
        LocalDate targetDate = latest.getSnapshotDate().minusDays(daysAgo);

        MaterialPriceSnapshot reference = historyDesc.stream()
                .filter(s -> s.getPrice() != null && !s.getSnapshotDate().isAfter(targetDate))
                .findFirst()
                .orElse(null);
        if (reference == null || reference == latest) return null;

        double refPrice = reference.getPrice().doubleValue();
        if (refPrice == 0) return null;
        double latestPrice = latest.getPrice().doubleValue();
        return Math.round(((latestPrice - refPrice) / refPrice) * 10000) / 100.0;
    }
}
