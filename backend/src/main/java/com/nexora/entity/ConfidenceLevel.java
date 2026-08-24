package com.nexora.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** HIGH is reserved for real, fresh, multi-source numeric price data — indicator-only materials
 * (no real feed) are capped at MEDIUM everywhere they're produced, never claimed as HIGH. */
public enum ConfidenceLevel {
    HIGH("high"),
    MEDIUM("medium"),
    LOW("low");

    private final String value;

    ConfidenceLevel(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static ConfidenceLevel fromValue(String value) {
        for (ConfidenceLevel level : values()) {
            if (level.value.equals(value)) return level;
        }
        throw new IllegalArgumentException("Unknown confidence level: " + value);
    }
}
