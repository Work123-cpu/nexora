package com.nexora.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** AI-classified category for a raw material — distinct from RawMaterial.category, which stays a
 * free-form user-typed string. UNCLASSIFIED is the default until the async classification call
 * (or the daily scheduler's safety net) resolves it. */
public enum MaterialCategory {
    AGRICULTURAL("agricultural"),
    METAL("metal"),
    MINERAL("mineral"),
    CHEMICAL("chemical"),
    INDUSTRIAL("industrial"),
    SPECIALTY("specialty"),
    UNCLASSIFIED("unclassified");

    private final String value;

    MaterialCategory(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static MaterialCategory fromValue(String value) {
        for (MaterialCategory category : values()) {
            if (category.value.equals(value)) return category;
        }
        throw new IllegalArgumentException("Unknown material category: " + value);
    }
}
