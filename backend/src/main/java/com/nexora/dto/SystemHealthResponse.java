package com.nexora.dto;

public record SystemHealthResponse(
        boolean databaseHealthy,
        long databaseLatencyMs
) {
}
