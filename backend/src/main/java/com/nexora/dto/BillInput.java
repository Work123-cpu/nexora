package com.nexora.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.List;

public record BillInput(
        @NotBlank String warehouseId,
        @NotBlank String customerName,
        String customerEmail,
        String customerPhone,
        @NotEmpty List<BillLineItemInput> items,
        @PositiveOrZero double taxPct,
        @PositiveOrZero double discountPct,
        String createdBy
) {
}
