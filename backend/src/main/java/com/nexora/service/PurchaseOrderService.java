package com.nexora.service;

import com.nexora.dto.AdvanceStatusRequest;
import com.nexora.dto.PurchaseOrderInput;
import com.nexora.entity.InventoryItem;
import com.nexora.entity.PurchaseOrder;
import com.nexora.entity.PurchaseOrderLineItem;
import com.nexora.entity.PurchaseOrderTimelineEvent;
import com.nexora.entity.StockMovement;
import com.nexora.exception.ResourceNotFoundException;
import com.nexora.repository.InventoryItemRepository;
import com.nexora.repository.PurchaseOrderRepository;
import com.nexora.repository.StockMovementRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class PurchaseOrderService {

    private final PurchaseOrderRepository repository;
    private final InventoryItemRepository inventoryItems;
    private final StockMovementRepository stockMovements;

    public PurchaseOrderService(PurchaseOrderRepository repository, InventoryItemRepository inventoryItems, StockMovementRepository stockMovements) {
        this.repository = repository;
        this.inventoryItems = inventoryItems;
        this.stockMovements = stockMovements;
    }

    public List<PurchaseOrder> list(String companyId, String vendorId) {
        if (vendorId != null) {
            return repository.findByCompanyIdAndVendorId(companyId, vendorId);
        }
        return repository.findByCompanyId(companyId);
    }

    public PurchaseOrder get(String companyId, String id) {
        PurchaseOrder po = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found: " + id));
        if (!po.getCompanyId().equals(companyId)) {
            throw new ResourceNotFoundException("Purchase order not found: " + id);
        }
        return po;
    }

    public PurchaseOrder create(String companyId, PurchaseOrderInput input) {
        PurchaseOrder po = new PurchaseOrder();
        po.setCompanyId(companyId);
        po.setPoNumber("PO-" + ThreadLocalRandom.current().nextInt(1000, 10000));
        po.setVendorId(input.vendorId());
        po.setWarehouseId(input.warehouseId());
        po.setStatus("pending_approval");
        po.setExpectedDeliveryDate(input.expectedDeliveryDate());
        po.setCreatedBy(input.createdBy());
        po.setSourceRecommendationId(input.sourceRecommendationId());

        List<PurchaseOrderLineItem> items = new ArrayList<>();
        double total = 0;
        for (var itemInput : input.items()) {
            PurchaseOrderLineItem item = new PurchaseOrderLineItem();
            item.setRawMaterialId(itemInput.rawMaterialId());
            item.setRawMaterialName(itemInput.rawMaterialName());
            item.setQuantity(itemInput.quantity());
            item.setUnit(itemInput.unit());
            item.setUnitCost(itemInput.unitCost());
            items.add(item);
            total += itemInput.quantity() * itemInput.unitCost();
        }
        po.setItems(items);
        po.setTotalAmount(total);

        List<PurchaseOrderTimelineEvent> timeline = new ArrayList<>();
        timeline.add(timelineEvent("draft", null));
        timeline.add(timelineEvent("pending_approval", null));
        po.setTimeline(timeline);

        return repository.save(po);
    }

    public PurchaseOrder advanceStatus(String companyId, String id, AdvanceStatusRequest req) {
        PurchaseOrder po = get(companyId, id);
        boolean justReceived = "received".equals(req.status()) && !"received".equals(po.getStatus());
        po.setStatus(req.status());
        if (req.approvedBy() != null) {
            po.setApprovedBy(req.approvedBy());
        }
        po.getTimeline().add(timelineEvent(req.status(), req.note()));
        PurchaseOrder saved = repository.save(po);
        if (justReceived) {
            receiveIntoInventory(saved);
        }
        return saved;
    }

    /** Adds every line item's quantity to the PO's warehouse stock and logs a StockMovement for
     * each — the only place a PO's real-world arrival actually changes what the app thinks is on
     * the shelf. Only fires once per PO (guarded by advanceStatus's justReceived check above), so
     * re-saving an already-received PO (e.g. editing its note) never double-counts stock. */
    private void receiveIntoInventory(PurchaseOrder po) {
        for (PurchaseOrderLineItem line : po.getItems()) {
            InventoryItem item = inventoryItems
                    .findByCompanyIdAndItemTypeAndItemIdAndWarehouseId(po.getCompanyId(), "rawMaterial", line.getRawMaterialId(), po.getWarehouseId())
                    .orElseGet(() -> {
                        InventoryItem fresh = new InventoryItem();
                        fresh.setCompanyId(po.getCompanyId());
                        fresh.setItemType("rawMaterial");
                        fresh.setItemId(line.getRawMaterialId());
                        fresh.setItemName(line.getRawMaterialName());
                        fresh.setUnit(line.getUnit());
                        fresh.setWarehouseId(po.getWarehouseId());
                        fresh.setQuantityOnHand(0);
                        return fresh;
                    });
            item.setQuantityOnHand(item.getQuantityOnHand() + line.getQuantity());
            item.setLastRestockedAt(Instant.now());
            inventoryItems.save(item);

            StockMovement movement = new StockMovement();
            movement.setCompanyId(po.getCompanyId());
            movement.setItemType("rawMaterial");
            movement.setItemId(line.getRawMaterialId());
            movement.setItemName(line.getRawMaterialName());
            movement.setWarehouseId(po.getWarehouseId());
            movement.setQuantity(line.getQuantity());
            movement.setUnit(line.getUnit());
            movement.setSource("po_receipt");
            movement.setSourceReferenceId(po.getId());
            stockMovements.save(movement);
        }
    }

    private PurchaseOrderTimelineEvent timelineEvent(String status, String note) {
        PurchaseOrderTimelineEvent event = new PurchaseOrderTimelineEvent();
        event.setStatus(status);
        event.setDate(Instant.now());
        event.setNote(note);
        return event;
    }
}
