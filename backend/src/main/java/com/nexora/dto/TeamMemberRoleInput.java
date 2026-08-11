package com.nexora.dto;

import com.nexora.entity.Role;
import jakarta.validation.constraints.NotNull;

public record TeamMemberRoleInput(
        @NotNull Role role
) {
}
