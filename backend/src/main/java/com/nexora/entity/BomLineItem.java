package com.nexora.entity;

import jakarta.persistence.Embeddable;

@Embeddable
public class BomLineItem {
    private String rawMaterialId;
    private double quantityPerUnit;
    private String unit;
    private double scrapPct;

    public String getRawMaterialId() { return rawMaterialId; }
    public void setRawMaterialId(String rawMaterialId) { this.rawMaterialId = rawMaterialId; }
    public double getQuantityPerUnit() { return quantityPerUnit; }
    public void setQuantityPerUnit(double quantityPerUnit) { this.quantityPerUnit = quantityPerUnit; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public double getScrapPct() { return scrapPct; }
    public void setScrapPct(double scrapPct) { this.scrapPct = scrapPct; }
}
