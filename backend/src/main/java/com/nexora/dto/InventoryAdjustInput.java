package com.nexora.dto;

import jakarta.validation.constraints.PositiveOrZero;

public record InventoryAdjustInput(
        @PositiveOrZero double quantityOnHand,
        @PositiveOrZero double safetyStock,
        @PositiveOrZero double reorderPoint,
        @PositiveOrZero double reorderQuantity,
        @PositiveOrZero double avgDailyUsage
) {
}
