package com.nexora.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record BillLineItemInput(
        @NotBlank String productId,
        @Positive double quantity,
        @PositiveOrZero double unitPrice
) {
}
