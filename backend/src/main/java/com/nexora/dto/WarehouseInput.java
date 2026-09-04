package com.nexora.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

/** No usedUnits field -- that's computed server-side from real inventory, never client-supplied
 * (see WarehouseService.withComputedUsedUnits). */
public record WarehouseInput(
        @NotBlank String name,
        @NotBlank String code,
        @NotBlank String type,
        String city,
        String state,
        String country,
        String managerName,
        @PositiveOrZero double capacityUnits,
        String status
) {
}
