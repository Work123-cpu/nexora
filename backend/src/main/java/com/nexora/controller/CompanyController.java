package com.nexora.controller;

import com.nexora.dto.CompanyDeleteRequest;
import com.nexora.dto.CompanySettingsInput;
import com.nexora.entity.Company;
import com.nexora.security.UserPrincipal;
import com.nexora.service.CompanyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
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

    /** Irreversible: deletes this company and everything in it. Admin-only, and requires the
     * acting admin's own password in the request body as confirmation. */
    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteCompany(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody CompanyDeleteRequest input) {
        service.deleteCompany(principal.companyId(), principal.userId(), input.password());
    }
}
