package com.nexora.controller;

import com.nexora.dto.BomInput;
import com.nexora.entity.BillOfMaterials;
import com.nexora.security.UserPrincipal;
import com.nexora.service.BomService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bom")
public class BomController {

    private final BomService service;

    public BomController(BomService service) {
        this.service = service;
    }

    @GetMapping
    public List<BillOfMaterials> list(@AuthenticationPrincipal UserPrincipal principal) {
        return service.list(principal.companyId());
    }

    @GetMapping("/{id}")
    public BillOfMaterials get(@AuthenticationPrincipal UserPrincipal principal, @PathVariable String id) {
        return service.get(principal.companyId(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','PROCUREMENT_MANAGER','WAREHOUSE_MANAGER','PRODUCTION_MANAGER')")
    public BillOfMaterials create(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody BomInput input) {
        return service.create(principal.companyId(), input);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PROCUREMENT_MANAGER','WAREHOUSE_MANAGER','PRODUCTION_MANAGER')")
    public BillOfMaterials update(@AuthenticationPrincipal UserPrincipal principal, @PathVariable String id, @Valid @RequestBody BomInput input) {
        return service.update(principal.companyId(), id, input);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable String id) {
        service.delete(principal.companyId(), id);
    }
}
