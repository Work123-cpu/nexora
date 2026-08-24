package com.nexora.dto;

/** Kept narrowly scoped to the fields the backend actually needs today (server-side market
 * price polling) — name/currency/locale remain frontend-localStorage-only, unchanged. */
public record CompanySettingsInput(
        String alphaVantageApiKey,
        String dataGovInApiKey
) {
}
