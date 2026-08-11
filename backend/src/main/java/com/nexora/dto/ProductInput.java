package com.nexora.dto;

import com.nexora.entity.ProductStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

public record ProductInput(
        @NotBlank String name,
        @NotBlank String category,
        String description,
        @NotBlank String unitOfMeasure,
        @PositiveOrZero double unitPrice,
        @PositiveOrZero double unitCost,
        ProductStatus status
) {
}
