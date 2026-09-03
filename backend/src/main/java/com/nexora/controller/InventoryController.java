package com.nexora.controller;

import com.nexora.dto.InventoryAdjustInput;
import com.nexora.dto.InventoryItemInput;
import com.nexora.entity.InventoryItem;
import com.nexora.entity.StockMovement;
import com.nexora.exception.ResourceNotFoundException;
import com.nexora.repository.InventoryItemRepository;
import com.nexora.repository.StockMovementRepository;
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
    private final StockMovementRepository stockMovements;

    public InventoryController(InventoryItemRepository repository, StockMovementRepository stockMovements) {
        this.repository = repository;
        this.stockMovements = stockMovements;
    }

    /** Admin-only: every stock-increasing event (PO receipts + manual additions) company-wide,
     * for the Stock Movements report — how much came in, by day/week/month. Not exposed to other
     * roles since it's a company-wide operational view, not scoped to what one role would
     * normally see. For a single item's own history (any role), see movementsForItem below. */
    @GetMapping("/movements")
    @PreAuthorize("hasRole('ADMIN')")
    public List<StockMovement> movements(@AuthenticationPrincipal UserPrincipal principal) {
        return stockMovements.findByCompanyIdOrderByCreatedAtDesc(principal.companyId());
    }

    /** One product/raw material's own restock history — e.g. RawMaterialDetailPage's "Recent
     * movements" panel. Open to any authenticated user, same as viewing the material itself. */
    @GetMapping("/movements/by-item/{itemId}")
    public List<StockMovement> movementsForItem(@AuthenticationPrincipal UserPrincipal principal, @PathVariable String itemId) {
        return stockMovements.findByCompanyIdAndItemIdOrderByCreatedAtDesc(principal.companyId(), itemId);
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
        InventoryItem saved = repository.save(item);
        if (input.quantityOnHand() > 0) {
            logManualMovement(saved, input.quantityOnHand());
        }
        return saved;
    }

    /** Adjusts an already-tracked item's stock levels/thresholds (e.g. after a manual stock count). */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PROCUREMENT_MANAGER','WAREHOUSE_MANAGER','PRODUCTION_MANAGER')")
    public InventoryItem adjust(@AuthenticationPrincipal UserPrincipal principal, @PathVariable String id, @Valid @RequestBody InventoryAdjustInput input) {
        InventoryItem item = get(principal, id);
        double delta = input.quantityOnHand() - item.getQuantityOnHand();
        item.setQuantityOnHand(input.quantityOnHand());
        item.setSafetyStock(input.safetyStock());
        item.setReorderPoint(input.reorderPoint());
        item.setReorderQuantity(input.reorderQuantity());
        item.setAvgDailyUsage(input.avgDailyUsage());
        item.setLastRestockedAt(Instant.now());
        InventoryItem saved = repository.save(item);
        if (delta > 0) {
            logManualMovement(saved, delta);
        }
        return saved;
    }

    /** Logs a manual (non-PO) stock addition — a new item tracked with an initial quantity, or an
     * existing item's count adjusted upward — for the admin Stock Movements report. */
    private void logManualMovement(InventoryItem item, double quantity) {
        StockMovement movement = new StockMovement();
        movement.setCompanyId(item.getCompanyId());
        movement.setItemType(item.getItemType());
        movement.setItemId(item.getItemId());
        movement.setItemName(item.getItemName());
        movement.setWarehouseId(item.getWarehouseId());
        movement.setQuantity(quantity);
        movement.setUnit(item.getUnit());
        movement.setSource("manual");
        stockMovements.save(movement);
    }
}
