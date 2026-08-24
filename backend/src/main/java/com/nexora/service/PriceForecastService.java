package com.nexora.service;

import com.nexora.entity.MaterialPriceSnapshot;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Deliberately its own file with zero shared code with ai-service's demand-forecasting
 * (xgboost/random_forest models) — the user's requirement is that Market Intelligence and Demand
 * Intelligence never share calculation logic. This is pure Java least-squares linear regression
 * over accumulated MaterialPriceSnapshot history, no ML training pipeline, since there's no
 * per-material training data to speak of. Only ever called for REAL_PRICE materials — indicator-
 * only materials never get a numeric forecast.
 */
@Service
public class PriceForecastService {

    private static final int MIN_HISTORY_POINTS = 7;
    private static final int HORIZON_DAYS = 7;

    public record Forecast(double projectedPrice, double lowerBound, double upperBound, int horizonDays, int confidenceScore) {}

    /** Empty until at least MIN_HISTORY_POINTS real (non-null-price) snapshots have accumulated —
     * a forecast from 2-3 points would be noise dressed up as a number, which is exactly what the
     * "don't invent a price" requirement rules out. */
    public Optional<Forecast> forecast(List<MaterialPriceSnapshot> snapshots) {
        List<MaterialPriceSnapshot> withPrice = snapshots.stream()
                .filter(s -> s.getPrice() != null)
                .sorted(Comparator.comparing(MaterialPriceSnapshot::getSnapshotDate))
                .toList();
        if (withPrice.size() < MIN_HISTORY_POINTS) return Optional.empty();

        int n = withPrice.size();
        double[] x = new double[n];
        double[] y = new double[n];
        for (int i = 0; i < n; i++) {
            x[i] = i;
            y[i] = withPrice.get(i).getPrice().doubleValue();
        }

        double sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (int i = 0; i < n; i++) {
            sumX += x[i];
            sumY += y[i];
            sumXY += x[i] * y[i];
            sumXX += x[i] * x[i];
        }
        double meanX = sumX / n;
        double meanY = sumY / n;
        double denominator = sumXX - n * meanX * meanX;
        if (denominator == 0) return Optional.empty();

        double slope = (sumXY - n * meanX * meanY) / denominator;
        double intercept = meanY - slope * meanX;

        double ssTotal = 0, ssResidual = 0;
        for (int i = 0; i < n; i++) {
            double predicted = intercept + slope * x[i];
            ssResidual += Math.pow(y[i] - predicted, 2);
            ssTotal += Math.pow(y[i] - meanY, 2);
        }
        double rSquared = ssTotal > 0 ? Math.max(0.0, Math.min(1.0, 1 - (ssResidual / ssTotal))) : 0.0;
        double stddev = Math.sqrt(ssResidual / n);

        double projectedX = (n - 1) + HORIZON_DAYS;
        double projectedPrice = intercept + slope * projectedX;
        double band = stddev * Math.sqrt(HORIZON_DAYS);
        double lowerBound = Math.max(0, projectedPrice - band);
        double upperBound = projectedPrice + band;

        // Confidence blends how much history backs the trend with how well a straight line
        // actually fits it — more points and a tighter fit both raise confidence.
        double historyFactor = Math.min(1.0, n / 30.0);
        double confidence01 = Math.max(0.0, Math.min(1.0, 0.4 * historyFactor + 0.6 * rSquared));
        int confidenceScore = (int) Math.round(confidence01 * 100);

        return Optional.of(new Forecast(round2(projectedPrice), round2(lowerBound), round2(upperBound), HORIZON_DAYS, confidenceScore));
    }

    private double round2(double v) {
        return Math.round(v * 100) / 100.0;
    }
}
