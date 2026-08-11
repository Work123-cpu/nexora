package com.nexora.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

public record RawMaterialInput(
        @NotBlank String code,
        @NotBlank String name,
        @NotBlank String category,
        @NotBlank String unit,
        @PositiveOrZero double unitCost,
        int leadTimeDays,
        boolean isPerishable,
        @NotBlank String primaryVendorId,
        String status
) {
}
