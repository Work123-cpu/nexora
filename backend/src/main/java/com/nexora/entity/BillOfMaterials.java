package com.nexora.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "bills_of_materials")
public class BillOfMaterials {

    @Id
    private String id = UUID.randomUUID().toString();

    @Column(name = "company_id", nullable = false)
    private String companyId;

    @Column(name = "product_id", nullable = false)
    private String productId;

    @Column(nullable = false)
    private String version = "v1.0";

    @ElementCollection
    @CollectionTable(name = "bom_materials", joinColumns = @JoinColumn(name = "bom_id"))
    private List<BomLineItem> materials = new ArrayList<>();

    @Column(name = "labor_cost_per_unit")
    private double laborCostPerUnit;

    @Column(name = "overhead_cost_per_unit")
    private double overheadCostPerUnit;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(length = 2000)
    private String notes;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCompanyId() { return companyId; }
    public void setCompanyId(String companyId) { this.companyId = companyId; }
    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    public List<BomLineItem> getMaterials() { return materials; }
    public void setMaterials(List<BomLineItem> materials) { this.materials = materials; }
    public double getLaborCostPerUnit() { return laborCostPerUnit; }
    public void setLaborCostPerUnit(double laborCostPerUnit) { this.laborCostPerUnit = laborCostPerUnit; }
    public double getOverheadCostPerUnit() { return overheadCostPerUnit; }
    public void setOverheadCostPerUnit(double overheadCostPerUnit) { this.overheadCostPerUnit = overheadCostPerUnit; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
