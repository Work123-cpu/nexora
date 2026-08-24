package com.nexora.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** One row per raw material — the AI-classified category and the resulting data-source routing
 * decision. Separate from RawMaterial.category (free-form, user-typed) and separate from
 * MaterialPriceSnapshot (the daily price/indicator history this classification feeds into). */
@Entity
@Table(name = "raw_material_intelligence", uniqueConstraints = @UniqueConstraint(columnNames = "raw_material_id"))
public class RawMaterialIntelligence {

    @Id
    private String id = UUID.randomUUID().toString();

    @Column(name = "company_id", nullable = false)
    private String companyId;

    @Column(name = "raw_material_id", nullable = false)
    private String rawMaterialId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MaterialCategory category = MaterialCategory.UNCLASSIFIED;

    @Column(name = "reference_commodity")
    private String referenceCommodity;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_mode", nullable = false)
    private DataMode dataMode = DataMode.PENDING;

    @Column(name = "classified_at")
    private Instant classifiedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCompanyId() { return companyId; }
    public void setCompanyId(String companyId) { this.companyId = companyId; }
    public String getRawMaterialId() { return rawMaterialId; }
    public void setRawMaterialId(String rawMaterialId) { this.rawMaterialId = rawMaterialId; }
    public MaterialCategory getCategory() { return category; }
    public void setCategory(MaterialCategory category) { this.category = category; }
    public String getReferenceCommodity() { return referenceCommodity; }
    public void setReferenceCommodity(String referenceCommodity) { this.referenceCommodity = referenceCommodity; }
    public DataMode getDataMode() { return dataMode; }
    public void setDataMode(DataMode dataMode) { this.dataMode = dataMode; }
    public Instant getClassifiedAt() { return classifiedAt; }
    public void setClassifiedAt(Instant classifiedAt) { this.classifiedAt = classifiedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
