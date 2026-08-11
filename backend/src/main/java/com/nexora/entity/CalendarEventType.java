package com.nexora.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** JSON value matches the frontend's kebab-case union type exactly, so no case-translation
 * layer is needed at the service boundary (unlike Role, which the frontend lowercases itself). */
public enum CalendarEventType {
    GOVERNMENT_HOLIDAY("government-holiday"),
    COMPANY_HOLIDAY("company-holiday"),
    SUPPLIER_HOLIDAY("supplier-holiday"),
    MAINTENANCE("maintenance");

    private final String value;

    CalendarEventType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static CalendarEventType fromValue(String value) {
        for (CalendarEventType type : values()) {
            if (type.value.equals(value)) return type;
        }
        throw new IllegalArgumentException("Unknown calendar event type: " + value);
    }
}
