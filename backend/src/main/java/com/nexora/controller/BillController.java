package com.nexora.controller;

import com.nexora.dto.BillInput;
import com.nexora.entity.Bill;
import com.nexora.security.UserPrincipal;
import com.nexora.service.BillService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bills")
public class BillController {

    private final BillService service;

    public BillController(BillService service) {
        this.service = service;
    }

    @GetMapping
    public List<Bill> list(@AuthenticationPrincipal UserPrincipal principal) {
        return service.list(principal.companyId());
    }

    @GetMapping("/{id}")
    public Bill get(@AuthenticationPrincipal UserPrincipal principal, @PathVariable String id) {
        return service.get(principal.companyId(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','PROCUREMENT_MANAGER','WAREHOUSE_MANAGER','PRODUCTION_MANAGER')")
    public Bill create(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody BillInput input) {
        return service.create(principal.companyId(), input);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('ADMIN')")
    public Bill cancel(@AuthenticationPrincipal UserPrincipal principal, @PathVariable String id) {
        return service.cancel(principal.companyId(), id);
    }
}
