package com.nexora.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.time.Instant;
import java.util.List;

public record PurchaseOrderInput(
        @NotBlank String vendorId,
        @NotBlank String warehouseId,
        @NotEmpty List<PurchaseOrderLineItemInput> items,
        Instant expectedDeliveryDate,
        String createdBy,
        String sourceRecommendationId
) {
}
