package com.nexora.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "warehouses")
public class Warehouse {

    @Id
    private String id = UUID.randomUUID().toString();

    @Column(name = "company_id", nullable = false)
    private String companyId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private String type;

    private String city;
    private String state;
    private String country;

    @Column(name = "manager_name")
    private String managerName;

    @Column(name = "capacity_units")
    private double capacityUnits;

    @Column(name = "used_units")
    private double usedUnits;

    @Column(nullable = false)
    private String status = "operational";

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCompanyId() { return companyId; }
    public void setCompanyId(String companyId) { this.companyId = companyId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getManagerName() { return managerName; }
    public void setManagerName(String managerName) { this.managerName = managerName; }
    public double getCapacityUnits() { return capacityUnits; }
    public void setCapacityUnits(double capacityUnits) { this.capacityUnits = capacityUnits; }
    public double getUsedUnits() { return usedUnits; }
    public void setUsedUnits(double usedUnits) { this.usedUnits = usedUnits; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
