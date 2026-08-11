package com.nexora.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

public record WarehouseInput(
        @NotBlank String name,
        @NotBlank String code,
        @NotBlank String type,
        String city,
        String state,
        String country,
        String managerName,
        @PositiveOrZero double capacityUnits,
        @PositiveOrZero double usedUnits,
        String status
) {
}
