package com.nexora.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** One row per raw material per day. price/unit/market are null for INDICATOR_ONLY materials —
 * there is deliberately no fallback number here; a null price must render as a qualitative
 * indicator on the frontend, never as "0" or a guessed figure. */
@Entity
@Table(name = "material_price_snapshots", uniqueConstraints = @UniqueConstraint(columnNames = {"raw_material_id", "snapshot_date"}))
public class MaterialPriceSnapshot {

    @Id
    private String id = UUID.randomUUID().toString();

    @Column(name = "company_id", nullable = false)
    private String companyId;

    @Column(name = "raw_material_id", nullable = false)
    private String rawMaterialId;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    @Column(precision = 14, scale = 4)
    private BigDecimal price;

    private String unit;

    @Column(nullable = false)
    private String source;

    private String market;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PriceTrend trend;

    @Enumerated(EnumType.STRING)
    @Column(name = "confidence_level", nullable = false)
    private ConfidenceLevel confidenceLevel;

    @Column(name = "is_spike", nullable = false)
    private boolean isSpike = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCompanyId() { return companyId; }
    public void setCompanyId(String companyId) { this.companyId = companyId; }
    public String getRawMaterialId() { return rawMaterialId; }
    public void setRawMaterialId(String rawMaterialId) { this.rawMaterialId = rawMaterialId; }
    public LocalDate getSnapshotDate() { return snapshotDate; }
    public void setSnapshotDate(LocalDate snapshotDate) { this.snapshotDate = snapshotDate; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getMarket() { return market; }
    public void setMarket(String market) { this.market = market; }
    public PriceTrend getTrend() { return trend; }
    public void setTrend(PriceTrend trend) { this.trend = trend; }
    public ConfidenceLevel getConfidenceLevel() { return confidenceLevel; }
    public void setConfidenceLevel(ConfidenceLevel confidenceLevel) { this.confidenceLevel = confidenceLevel; }
    public boolean isSpike() { return isSpike; }
    public void setSpike(boolean spike) { isSpike = spike; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
