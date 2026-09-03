package com.nexora.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** One row per stock-increasing event — a PO being marked Received, a manual "Add Stock" entry,
 * or a manual stock-count adjustment that raised the quantity. Feeds the admin-only Stock
 * Movements report (how much stock came in, daily/weekly/monthly) — InventoryItem itself only
 * ever holds a live snapshot, not history, so without this there'd be no way to answer "how
 * much was added" after the fact. */
@Entity
@Table(name = "stock_movements")
public class StockMovement {

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

    @Column(name = "warehouse_id", nullable = false)
    private String warehouseId;

    @Column(nullable = false)
    private double quantity;

    private String unit;

    /** "po_receipt" | "manual" */
    @Column(nullable = false)
    private String source;

    /** The purchase order id when source is "po_receipt"; null otherwise. */
    @Column(name = "source_reference_id")
    private String sourceReferenceId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

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
    public String getWarehouseId() { return warehouseId; }
    public void setWarehouseId(String warehouseId) { this.warehouseId = warehouseId; }
    public double getQuantity() { return quantity; }
    public void setQuantity(double quantity) { this.quantity = quantity; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getSourceReferenceId() { return sourceReferenceId; }
    public void setSourceReferenceId(String sourceReferenceId) { this.sourceReferenceId = sourceReferenceId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
