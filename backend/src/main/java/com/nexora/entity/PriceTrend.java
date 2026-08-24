package com.nexora.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum PriceTrend {
    RISING("rising"),
    STABLE("stable"),
    FALLING("falling");

    private final String value;

    PriceTrend(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static PriceTrend fromValue(String value) {
        for (PriceTrend trend : values()) {
            if (trend.value.equals(value)) return trend;
        }
        throw new IllegalArgumentException("Unknown price trend: " + value);
    }
}
