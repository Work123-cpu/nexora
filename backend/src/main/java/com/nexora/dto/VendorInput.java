package com.nexora.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record VendorInput(
        @NotBlank String name,
        @NotBlank String category,
        String contactName,
        @Email String email,
        String phone,
        String city,
        String country,
        double rating,
        double onTimeDeliveryPct,
        double qualityScorePct,
        int leadTimeDays,
        int activeContracts,
        List<String> materialsSupplied,
        String status
) {
}
