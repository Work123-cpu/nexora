package com.nexora.controller;

import com.nexora.dto.CompanySettingsInput;
import com.nexora.entity.Company;
import com.nexora.security.UserPrincipal;
import com.nexora.service.CompanyService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/company")
public class CompanyController {

    private final CompanyService service;

    public CompanyController(CompanyService service) {
        this.service = service;
    }

    @PutMapping("/settings")
    public Company updateSettings(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody CompanySettingsInput input) {
        return service.updateSettings(principal.companyId(), input);
    }
}
