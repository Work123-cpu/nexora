package com.nexora.dto;

import java.math.BigDecimal;

/** Response shape for GET /api/market-intelligence. Every nullable field is null, not a fake
 * default, whenever there isn't yet enough real data to say something honest — a brand-new
 * material with no snapshot yet, or a REAL_PRICE material without enough history to forecast. */
public record MaterialIntelligenceView(
        String rawMaterialId,
        String materialName,
        String category,
        String dataMode,
        BigDecimal currentPrice,
        String unit,
        String source,
        String market,
        Double changePct1d,
        Double changePct7d,
        Double changePct30d,
        String trend,
        String confidenceLevel,
        ForecastView forecast,
        String lastUpdated,
        boolean isEstimate
) {
    public record ForecastView(double projectedPrice, double lowerBound, double upperBound, int horizonDays, int confidenceScore) {}
}
