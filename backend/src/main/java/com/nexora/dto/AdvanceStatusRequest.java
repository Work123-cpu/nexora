package com.nexora.dto;

import jakarta.validation.constraints.NotBlank;

public record AdvanceStatusRequest(
        @NotBlank String status,
        String note,
        String approvedBy
) {
}
