package com.nexora.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record BomInput(
        @NotBlank String productId,
        String version,
        List<BomLineItemInput> materials,
        double laborCostPerUnit,
        double overheadCostPerUnit,
        String notes
) {
}
