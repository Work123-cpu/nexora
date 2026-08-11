package com.nexora.dto;

public record AuthResponse(
        String token,
        String userId,
        String companyId,
        String name,
        String email,
        String role
) {
}
