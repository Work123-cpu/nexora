package com.nexora.service;

import com.nexora.dto.BillInput;
import com.nexora.dto.BillLineItemInput;
import com.nexora.entity.Bill;
import com.nexora.entity.BillLineItem;
import com.nexora.entity.Product;
import com.nexora.exception.ResourceNotFoundException;
import com.nexora.repository.BillRepository;
import com.nexora.repository.InventoryItemRepository;
import com.nexora.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Billing a product decrements its real inventory in the same database transaction as the
 * bill itself — either both happen or neither does. A product with no tracked InventoryItem
 * row for the chosen warehouse is billed without touching stock (nothing to decrement);
 * a product that IS tracked but doesn't have enough on hand blocks the whole bill rather
 * than letting stock go negative.
 */
@Service
public class BillService {

    private final BillRepository billRepository;
    private final ProductRepository productRepository;
    private final InventoryItemRepository inventoryRepository;

    public BillService(BillRepository billRepository, ProductRepository productRepository, InventoryItemRepository inventoryRepository) {
        this.billRepository = billRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
    }

    public List<Bill> list(String companyId) {
        return billRepository.findByCompanyId(companyId);
    }

    public Bill get(String companyId, String id) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found: " + id));
        if (!bill.getCompanyId().equals(companyId)) {
            throw new ResourceNotFoundException("Bill not found: " + id);
        }
        return bill;
    }

    @Transactional
    public Bill create(String companyId, BillInput input) {
        Bill bill = new Bill();
        bill.setCompanyId(companyId);
        bill.setBillNumber("BILL-" + ThreadLocalRandom.current().nextInt(1000, 10000));
        bill.setWarehouseId(input.warehouseId());
        bill.setCustomerName(input.customerName());
        bill.setCustomerEmail(input.customerEmail());
        bill.setCustomerPhone(input.customerPhone());
        bill.setCreatedBy(input.createdBy());
        bill.setStatus("completed");
        if (input.createdAt() != null) {
            bill.setCreatedAt(input.createdAt());
        }

        List<BillLineItem> lineItems = new ArrayList<>();
        double subtotal = 0;

        for (BillLineItemInput itemInput : input.items()) {
            Product product = productRepository.findById(itemInput.productId())
                    .orElseThrow(() -> new IllegalArgumentException("Unknown product: " + itemInput.productId()));
            if (!product.getCompanyId().equals(companyId)) {
                throw new IllegalArgumentException("Unknown product: " + itemInput.productId());
            }

            decrementStock(companyId, product, input.warehouseId(), itemInput.quantity());

            BillLineItem line = new BillLineItem();
            line.setProductId(product.getId());
            line.setProductName(product.getName());
            line.setUnit(product.getUnitOfMeasure());
            line.setQuantity(itemInput.quantity());
            line.setUnitPrice(itemInput.unitPrice());
            line.setLineTotal(round2(itemInput.quantity() * itemInput.unitPrice()));
            lineItems.add(line);
            subtotal += line.getLineTotal();
        }

        double discountAmount = round2(subtotal * input.discountPct() / 100);
        double taxableAmount = subtotal - discountAmount;
        double taxAmount = round2(taxableAmount * input.taxPct() / 100);

        bill.setItems(lineItems);
        bill.setSubtotal(round2(subtotal));
        bill.setDiscountPct(input.discountPct());
        bill.setDiscountAmount(discountAmount);
        bill.setTaxPct(input.taxPct());
        bill.setTaxAmount(taxAmount);
        bill.setTotalAmount(round2(taxableAmount + taxAmount));

        return billRepository.save(bill);
    }

    @Transactional
    public Bill cancel(String companyId, String id) {
        Bill bill = get(companyId, id);
        if ("cancelled".equals(bill.getStatus())) {
            return bill;
        }
        for (BillLineItem line : bill.getItems()) {
            inventoryRepository.findByCompanyIdAndItemTypeAndItemIdAndWarehouseId(companyId, "product", line.getProductId(), bill.getWarehouseId())
                    .ifPresent(inv -> {
                        inv.setQuantityOnHand(inv.getQuantityOnHand() + line.getQuantity());
                        inventoryRepository.save(inv);
                    });
        }
        bill.setStatus("cancelled");
        bill.setCancelledAt(Instant.now());
        return billRepository.save(bill);
    }

    private void decrementStock(String companyId, Product product, String warehouseId, double quantity) {
        inventoryRepository.findByCompanyIdAndItemTypeAndItemIdAndWarehouseId(companyId, "product", product.getId(), warehouseId)
                .ifPresent(inv -> {
                    if (inv.getQuantityOnHand() < quantity) {
                        throw new IllegalArgumentException(
                                "Insufficient stock for " + product.getName() + ": have " + inv.getQuantityOnHand() + " " + inv.getUnit()
                                        + ", need " + quantity);
                    }
                    inv.setQuantityOnHand(inv.getQuantityOnHand() - quantity);
                    inventoryRepository.save(inv);
                });
        // No InventoryItem row for this product/warehouse — nothing tracked to decrement, and
        // that's fine; billing still proceeds (matches how products can exist without inventory
        // tracking today).
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
