package com.nexora.controller;

import com.nexora.dto.InventoryAdjustInput;
import com.nexora.dto.InventoryItemInput;
import com.nexora.entity.InventoryItem;
import com.nexora.exception.ResourceNotFoundException;
import com.nexora.repository.InventoryItemRepository;
import com.nexora.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryItemRepository repository;

    public InventoryController(InventoryItemRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<InventoryItem> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String warehouseId
    ) {
        if (warehouseId != null) {
            return repository.findByCompanyIdAndWarehouseId(principal.companyId(), warehouseId);
        }
        return repository.findByCompanyId(principal.companyId());
    }

    @GetMapping("/{id}")
    public InventoryItem get(@AuthenticationPrincipal UserPrincipal principal, @PathVariable String id) {
        InventoryItem item = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found: " + id));
        if (!item.getCompanyId().equals(principal.companyId())) {
            throw new ResourceNotFoundException("Inventory item not found: " + id);
        }
        return item;
    }

    /** Starts tracking a product/raw material's stock in a warehouse — the only way real
     * initial stock gets into the system (nothing auto-creates this on product/warehouse
     * creation, by design: not every item needs to be inventory-tracked). */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','PROCUREMENT_MANAGER','WAREHOUSE_MANAGER','PRODUCTION_MANAGER')")
    public InventoryItem create(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody InventoryItemInput input) {
        if (repository.findByCompanyIdAndItemTypeAndItemIdAndWarehouseId(principal.companyId(), input.itemType(), input.itemId(), input.warehouseId()).isPresent()) {
            throw new IllegalArgumentException("This item is already tracked in the selected warehouse — use adjust stock instead.");
        }
        InventoryItem item = new InventoryItem();
        item.setCompanyId(principal.companyId());
        item.setItemType(input.itemType());
        item.setItemId(input.itemId());
        item.setItemName(input.itemName());
        item.setCategory(input.category());
        item.setUnit(input.unit());
        item.setWarehouseId(input.warehouseId());
        item.setQuantityOnHand(input.quantityOnHand());
        item.setSafetyStock(input.safetyStock());
        item.setReorderPoint(input.reorderPoint());
        item.setReorderQuantity(input.reorderQuantity());
        item.setAvgDailyUsage(input.avgDailyUsage());
        item.setLastRestockedAt(Instant.now());
        return repository.save(item);
    }

    /** Adjusts an already-tracked item's stock levels/thresholds (e.g. after a manual stock count). */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PROCUREMENT_MANAGER','WAREHOUSE_MANAGER','PRODUCTION_MANAGER')")
    public InventoryItem adjust(@AuthenticationPrincipal UserPrincipal principal, @PathVariable String id, @Valid @RequestBody InventoryAdjustInput input) {
        InventoryItem item = get(principal, id);
        item.setQuantityOnHand(input.quantityOnHand());
        item.setSafetyStock(input.safetyStock());
        item.setReorderPoint(input.reorderPoint());
        item.setReorderQuantity(input.reorderQuantity());
        item.setAvgDailyUsage(input.avgDailyUsage());
        item.setLastRestockedAt(Instant.now());
        return repository.save(item);
    }
}
