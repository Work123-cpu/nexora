package com.nexora.controller;

import com.nexora.dto.AdvanceStatusRequest;
import com.nexora.dto.PurchaseOrderInput;
import com.nexora.entity.PurchaseOrder;
import com.nexora.security.UserPrincipal;
import com.nexora.service.PurchaseOrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/purchase-orders")
public class PurchaseOrderController {

    private final PurchaseOrderService service;

    public PurchaseOrderController(PurchaseOrderService service) {
        this.service = service;
    }

    @GetMapping
    public List<PurchaseOrder> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String vendorId
    ) {
        return service.list(principal.companyId(), vendorId);
    }

    @GetMapping("/{id}")
    public PurchaseOrder get(@AuthenticationPrincipal UserPrincipal principal, @PathVariable String id) {
        return service.get(principal.companyId(), id);
    }

    private static final Set<String> APPROVE_ROLES = Set.of("ADMIN", "PROCUREMENT_MANAGER");

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','PROCUREMENT_MANAGER','WAREHOUSE_MANAGER','PRODUCTION_MANAGER')")
    public PurchaseOrder create(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody PurchaseOrderInput input) {
        return service.create(principal.companyId(), input);
    }

    @PostMapping("/{id}/advance-status")
    @PreAuthorize("hasAnyRole('ADMIN','PROCUREMENT_MANAGER','WAREHOUSE_MANAGER','PRODUCTION_MANAGER')")
    public PurchaseOrder advanceStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody AdvanceStatusRequest req
    ) {
        // Only "approving" a PO specifically requires the elevated approve permission —
        // other stage transitions (ordered/in_transit/received/cancelled) just need edit access,
        // matching the frontend's RoleGuard usage (only the Approve button is gated).
        if ("approved".equals(req.status()) && !APPROVE_ROLES.contains(principal.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only an admin or procurement manager can approve a purchase order.");
        }
        return service.advanceStatus(principal.companyId(), id, req);
    }
}
