package com.nexora.service;

import com.nexora.dto.AdvanceStatusRequest;
import com.nexora.dto.PurchaseOrderInput;
import com.nexora.entity.PurchaseOrder;
import com.nexora.entity.PurchaseOrderLineItem;
import com.nexora.entity.PurchaseOrderTimelineEvent;
import com.nexora.exception.ResourceNotFoundException;
import com.nexora.repository.PurchaseOrderRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class PurchaseOrderService {

    private final PurchaseOrderRepository repository;

    public PurchaseOrderService(PurchaseOrderRepository repository) {
        this.repository = repository;
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
        po.setStatus(req.status());
        if (req.approvedBy() != null) {
            po.setApprovedBy(req.approvedBy());
        }
        po.getTimeline().add(timelineEvent(req.status(), req.note()));
        return repository.save(po);
    }

    private PurchaseOrderTimelineEvent timelineEvent(String status, String note) {
        PurchaseOrderTimelineEvent event = new PurchaseOrderTimelineEvent();
        event.setStatus(status);
        event.setDate(Instant.now());
        event.setNote(note);
        return event;
    }
}
