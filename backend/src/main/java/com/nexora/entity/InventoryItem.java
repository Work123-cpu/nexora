package com.nexora.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "inventory_items")
public class InventoryItem {

    @Id
    private String id = UUID.randomUUID().toString();

    @Column(name = "company_id", nullable = false)
    private String companyId;

    @Column(name = "item_type", nullable = false)
    private String itemType;

    @Column(name = "item_id", nullable = false)
    private String itemId;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    private String category;
    private String unit;

    @Column(name = "warehouse_id", nullable = false)
    private String warehouseId;

    @Column(name = "quantity_on_hand")
    private double quantityOnHand;

    @Column(name = "safety_stock")
    private double safetyStock;

    @Column(name = "reorder_point")
    private double reorderPoint;

    @Column(name = "reorder_quantity")
    private double reorderQuantity;

    @Column(name = "avg_daily_usage")
    private double avgDailyUsage;

    @Column(name = "last_restocked_at")
    private Instant lastRestockedAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCompanyId() { return companyId; }
    public void setCompanyId(String companyId) { this.companyId = companyId; }
    public String getItemType() { return itemType; }
    public void setItemType(String itemType) { this.itemType = itemType; }
    public String getItemId() { return itemId; }
    public void setItemId(String itemId) { this.itemId = itemId; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public String getWarehouseId() { return warehouseId; }
    public void setWarehouseId(String warehouseId) { this.warehouseId = warehouseId; }
    public double getQuantityOnHand() { return quantityOnHand; }
    public void setQuantityOnHand(double quantityOnHand) { this.quantityOnHand = quantityOnHand; }
    public double getSafetyStock() { return safetyStock; }
    public void setSafetyStock(double safetyStock) { this.safetyStock = safetyStock; }
    public double getReorderPoint() { return reorderPoint; }
    public void setReorderPoint(double reorderPoint) { this.reorderPoint = reorderPoint; }
    public double getReorderQuantity() { return reorderQuantity; }
    public void setReorderQuantity(double reorderQuantity) { this.reorderQuantity = reorderQuantity; }
    public double getAvgDailyUsage() { return avgDailyUsage; }
    public void setAvgDailyUsage(double avgDailyUsage) { this.avgDailyUsage = avgDailyUsage; }
    public Instant getLastRestockedAt() { return lastRestockedAt; }
    public void setLastRestockedAt(Instant lastRestockedAt) { this.lastRestockedAt = lastRestockedAt; }
}
