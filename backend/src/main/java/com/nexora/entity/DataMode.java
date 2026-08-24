package com.nexora.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** Whether a material's price intelligence is backed by a real numeric feed (Agmarknet/Alpha
 * Vantage) or falls back to an AI-reasoned qualitative indicator with no fabricated number. */
public enum DataMode {
    PENDING("pending"),
    REAL_PRICE("real_price"),
    INDICATOR_ONLY("indicator_only");

    private final String value;

    DataMode(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static DataMode fromValue(String value) {
        for (DataMode mode : values()) {
            if (mode.value.equals(value)) return mode;
        }
        throw new IllegalArgumentException("Unknown data mode: " + value);
    }
}
