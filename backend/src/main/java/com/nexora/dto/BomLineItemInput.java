package com.nexora.dto;

public record BomLineItemInput(
        String rawMaterialId,
        double quantityPerUnit,
        String unit,
        double scrapPct
) {
}
