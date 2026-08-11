package com.nexora.dto;

import com.nexora.entity.CalendarEventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record CalendarEventInput(
        @NotBlank String title,
        @NotNull CalendarEventType type,
        @NotNull Instant date,
        Instant endDate,
        String description,
        String relatedVendorId
) {
}
