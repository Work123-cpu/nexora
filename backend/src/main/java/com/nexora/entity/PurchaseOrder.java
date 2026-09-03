package com.nexora.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "purchase_orders")
public class PurchaseOrder {

    @Id
    private String id = UUID.randomUUID().toString();

    @Column(name = "company_id", nullable = false)
    private String companyId;

    @Column(name = "po_number", nullable = false)
    private String poNumber;

    @Column(name = "vendor_id", nullable = false)
    private String vendorId;

    @Column(name = "warehouse_id", nullable = false)
    private String warehouseId;

    @Column(nullable = false)
    private String status = "draft";

    @ElementCollection
    @CollectionTable(name = "purchase_order_items", joinColumns = @JoinColumn(name = "po_id"))
    private List<PurchaseOrderLineItem> items = new ArrayList<>();

    @Column(name = "total_amount")
    private double totalAmount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "expected_delivery_date")
    private Instant expectedDeliveryDate;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "approved_by")
    private String approvedBy;

    @ElementCollection
    @CollectionTable(name = "purchase_order_timeline", joinColumns = @JoinColumn(name = "po_id"))
    private List<PurchaseOrderTimelineEvent> timeline = new ArrayList<>();

    @Column(name = "source_recommendation_id")
    private String sourceRecommendationId;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCompanyId() { return companyId; }
    public void setCompanyId(String companyId) { this.companyId = companyId; }
    public String getPoNumber() { return poNumber; }
    public void setPoNumber(String poNumber) { this.poNumber = poNumber; }
    public String getVendorId() { return vendorId; }
    public void setVendorId(String vendorId) { this.vendorId = vendorId; }
    public String getWarehouseId() { return warehouseId; }
    public void setWarehouseId(String warehouseId) { this.warehouseId = warehouseId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<PurchaseOrderLineItem> getItems() { return items; }
    public void setItems(List<PurchaseOrderLineItem> items) { this.items = items; }
    public double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getExpectedDeliveryDate() { return expectedDeliveryDate; }
    public void setExpectedDeliveryDate(Instant expectedDeliveryDate) { this.expectedDeliveryDate = expectedDeliveryDate; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    public List<PurchaseOrderTimelineEvent> getTimeline() { return timeline; }
    public void setTimeline(List<PurchaseOrderTimelineEvent> timeline) { this.timeline = timeline; }
    public String getSourceRecommendationId() { return sourceRecommendationId; }
    public void setSourceRecommendationId(String sourceRecommendationId) { this.sourceRecommendationId = sourceRecommendationId; }
}
