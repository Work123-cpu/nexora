package com.nexora.security;

/** Carries the authenticated user's id, companyId, and role — resolved from the JWT on every request. */
public record UserPrincipal(String userId, String companyId, String role) {
}
