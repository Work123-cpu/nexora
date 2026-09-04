package com.nexora.dto;

import jakarta.validation.constraints.NotBlank;

public record CompanyDeleteRequest(
        @NotBlank String password
) {
}
