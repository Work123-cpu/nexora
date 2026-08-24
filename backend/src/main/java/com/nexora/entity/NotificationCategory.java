package com.nexora.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** Mirrors the frontend's NotificationCategory union exactly (see CalendarEventType for the
 * same pattern) — only the categories actually produced by NotificationService's sync methods;
 * the frontend type also allows 'forecast'/'system' for future use, not needed here yet. */
public enum NotificationCategory {
    INVENTORY("inventory"),
    PROCUREMENT("procurement"),
    VENDOR("vendor"),
    MARKET("market");

    private final String value;

    NotificationCategory(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static NotificationCategory fromValue(String value) {
        for (NotificationCategory category : values()) {
            if (category.value.equals(value)) return category;
        }
        throw new IllegalArgumentException("Unknown notification category: " + value);
    }
}
