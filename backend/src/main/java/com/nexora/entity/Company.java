package com.nexora.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "companies")
public class Company {

    @Id
    private String id = UUID.randomUUID().toString();

    @Column(nullable = false)
    private String name;

    @Column(name = "currency_code", nullable = false)
    private String currencyCode = "INR";

    @Column(nullable = false)
    private String locale = "en-IN";

    // Nullable — set only once the user adds a free Alpha Vantage key in Settings. Powers
    // MarketDataService's server-side price-move notifications; the frontend also keeps its own
    // copy in localStorage for the client-side Market Intelligence page (see SettingsPage.tsx).
    @Column(name = "alpha_vantage_api_key")
    private String alphaVantageApiKey;

    // Nullable — set only once the user adds a free data.gov.in key in Settings. Powers
    // AgmarknetService's Indian mandi price lookups for agricultural raw materials.
    @Column(name = "data_gov_in_api_key")
    private String dataGovInApiKey;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCurrencyCode() { return currencyCode; }
    public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }
    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }
    public String getAlphaVantageApiKey() { return alphaVantageApiKey; }
    public void setAlphaVantageApiKey(String alphaVantageApiKey) { this.alphaVantageApiKey = alphaVantageApiKey; }
    public String getDataGovInApiKey() { return dataGovInApiKey; }
    public void setDataGovInApiKey(String dataGovInApiKey) { this.dataGovInApiKey = dataGovInApiKey; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
