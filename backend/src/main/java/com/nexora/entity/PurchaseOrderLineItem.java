package com.nexora.entity;

import jakarta.persistence.Embeddable;

@Embeddable
public class PurchaseOrderLineItem {
    private String rawMaterialId;
    private String rawMaterialName;
    private double quantity;
    private String unit;
    private double unitCost;

    public String getRawMaterialId() { return rawMaterialId; }
    public void setRawMaterialId(String rawMaterialId) { this.rawMaterialId = rawMaterialId; }
    public String getRawMaterialName() { return rawMaterialName; }
    public void setRawMaterialName(String rawMaterialName) { this.rawMaterialName = rawMaterialName; }
    public double getQuantity() { return quantity; }
    public void setQuantity(double quantity) { this.quantity = quantity; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public double getUnitCost() { return unitCost; }
    public void setUnitCost(double unitCost) { this.unitCost = unitCost; }
}
