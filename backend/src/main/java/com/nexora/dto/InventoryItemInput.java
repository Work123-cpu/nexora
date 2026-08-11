package com.nexora.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

public record InventoryItemInput(
        @NotBlank String itemType,
        @NotBlank String itemId,
        @NotBlank String itemName,
        String category,
        @NotBlank String unit,
        @NotBlank String warehouseId,
        @PositiveOrZero double quantityOnHand,
        @PositiveOrZero double safetyStock,
        @PositiveOrZero double reorderPoint,
        @PositiveOrZero double reorderQuantity,
        @PositiveOrZero double avgDailyUsage
) {
}
