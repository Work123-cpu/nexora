package com.nexora.dto;

import com.nexora.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TeamMemberInput(
        @NotBlank String name,
        @Email @NotBlank String email,
        @Size(min = 6) @NotBlank String password,
        @NotNull Role role,
        String jobTitle
) {
}
