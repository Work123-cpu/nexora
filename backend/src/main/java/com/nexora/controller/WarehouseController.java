package com.nexora.controller;

import com.nexora.dto.WarehouseInput;
import com.nexora.entity.Warehouse;
import com.nexora.security.UserPrincipal;
import com.nexora.service.WarehouseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/warehouses")
public class WarehouseController {

    private final WarehouseService service;

    public WarehouseController(WarehouseService service) {
        this.service = service;
    }

    @GetMapping
    public List<Warehouse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return service.list(principal.companyId());
    }

    @GetMapping("/{id}")
    public Warehouse get(@AuthenticationPrincipal UserPrincipal principal, @PathVariable String id) {
        return service.get(principal.companyId(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','PROCUREMENT_MANAGER','WAREHOUSE_MANAGER','PRODUCTION_MANAGER')")
    public Warehouse create(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody WarehouseInput input) {
        return service.create(principal.companyId(), input);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PROCUREMENT_MANAGER','WAREHOUSE_MANAGER','PRODUCTION_MANAGER')")
    public Warehouse update(@AuthenticationPrincipal UserPrincipal principal, @PathVariable String id, @Valid @RequestBody WarehouseInput input) {
        return service.update(principal.companyId(), id, input);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable String id) {
        service.delete(principal.companyId(), id);
    }
}
