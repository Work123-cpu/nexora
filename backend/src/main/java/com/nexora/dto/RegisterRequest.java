package com.nexora.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank String companyName,
        @NotBlank String name,
        @Email @NotBlank String email,
        @Size(min = 6) @NotBlank String password
) {
}
