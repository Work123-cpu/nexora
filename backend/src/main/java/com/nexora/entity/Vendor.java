package com.nexora.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "vendors")
public class Vendor {

    @Id
    private String id = UUID.randomUUID().toString();

    @Column(name = "company_id", nullable = false)
    private String companyId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category;

    @Column(name = "contact_name")
    private String contactName;

    private String email;
    private String phone;
    private String city;
    private String country;

    private double rating;

    @Column(name = "on_time_delivery_pct")
    private double onTimeDeliveryPct;

    @Column(name = "quality_score_pct")
    private double qualityScorePct;

    @Column(name = "lead_time_days")
    private int leadTimeDays;

    @Column(name = "active_contracts")
    private int activeContracts;

    @ElementCollection
    @CollectionTable(name = "vendor_materials_supplied", joinColumns = @JoinColumn(name = "vendor_id"))
    @Column(name = "raw_material_id")
    private List<String> materialsSupplied = new ArrayList<>();

    @Column(nullable = false)
    private String status = "active";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCompanyId() { return companyId; }
    public void setCompanyId(String companyId) { this.companyId = companyId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }
    public double getOnTimeDeliveryPct() { return onTimeDeliveryPct; }
    public void setOnTimeDeliveryPct(double onTimeDeliveryPct) { this.onTimeDeliveryPct = onTimeDeliveryPct; }
    public double getQualityScorePct() { return qualityScorePct; }
    public void setQualityScorePct(double qualityScorePct) { this.qualityScorePct = qualityScorePct; }
    public int getLeadTimeDays() { return leadTimeDays; }
    public void setLeadTimeDays(int leadTimeDays) { this.leadTimeDays = leadTimeDays; }
    public int getActiveContracts() { return activeContracts; }
    public void setActiveContracts(int activeContracts) { this.activeContracts = activeContracts; }
    public List<String> getMaterialsSupplied() { return materialsSupplied; }
    public void setMaterialsSupplied(List<String> materialsSupplied) { this.materialsSupplied = materialsSupplied; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
