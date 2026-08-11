package com.nexora.dto;

public record PurchaseOrderLineItemInput(
        String rawMaterialId,
        String rawMaterialName,
        double quantity,
        String unit,
        double unitCost
) {
}
