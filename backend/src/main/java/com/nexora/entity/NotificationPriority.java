package com.nexora.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum NotificationPriority {
    CRITICAL("critical"),
    HIGH("high"),
    MEDIUM("medium"),
    LOW("low");

    private final String value;

    NotificationPriority(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static NotificationPriority fromValue(String value) {
        for (NotificationPriority priority : values()) {
            if (priority.value.equals(value)) return priority;
        }
        throw new IllegalArgumentException("Unknown notification priority: " + value);
    }
}
