package com.nexora.service;

import com.nexora.dto.WarehouseInput;
import com.nexora.entity.InventoryItem;
import com.nexora.entity.Warehouse;
import com.nexora.exception.ResourceNotFoundException;
import com.nexora.repository.InventoryItemRepository;
import com.nexora.repository.WarehouseRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WarehouseService {

    private final WarehouseRepository repository;
    private final InventoryItemRepository inventoryItems;

    public WarehouseService(WarehouseRepository repository, InventoryItemRepository inventoryItems) {
        this.repository = repository;
        this.inventoryItems = inventoryItems;
    }

    public List<Warehouse> list(String companyId) {
        return repository.findByCompanyId(companyId).stream().map(w -> withComputedUsedUnits(companyId, w)).toList();
    }

    public Warehouse get(String companyId, String id) {
        Warehouse warehouse = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found: " + id));
        if (!warehouse.getCompanyId().equals(companyId)) {
            throw new ResourceNotFoundException("Warehouse not found: " + id);
        }
        return withComputedUsedUnits(companyId, warehouse);
    }

    public Warehouse create(String companyId, WarehouseInput input) {
        Warehouse warehouse = new Warehouse();
        warehouse.setCompanyId(companyId);
        apply(warehouse, input);
        return withComputedUsedUnits(companyId, repository.save(warehouse));
    }

    public Warehouse update(String companyId, String id, WarehouseInput input) {
        Warehouse warehouse = get(companyId, id);
        apply(warehouse, input);
        return withComputedUsedUnits(companyId, repository.save(warehouse));
    }

    public void delete(String companyId, String id) {
        repository.delete(get(companyId, id));
    }

    private void apply(Warehouse warehouse, WarehouseInput input) {
        warehouse.setName(input.name());
        warehouse.setCode(input.code());
        warehouse.setType(input.type());
        warehouse.setCity(input.city());
        warehouse.setState(input.state());
        warehouse.setCountry(input.country());
        warehouse.setManagerName(input.managerName());
        warehouse.setCapacityUnits(input.capacityUnits());
        warehouse.setStatus(input.status() != null ? input.status() : "operational");
    }

    /** Used capacity used to be a plain number typed into the warehouse form once and never
     * touched again -- stocking, receiving, or bulk-importing inventory into a warehouse never
     * updated it, so it silently went stale. Computed fresh from real InventoryItem quantities on
     * every read instead. */
    private Warehouse withComputedUsedUnits(String companyId, Warehouse warehouse) {
        double used = inventoryItems.findByCompanyIdAndWarehouseId(companyId, warehouse.getId()).stream()
                .mapToDouble(InventoryItem::getQuantityOnHand)
                .sum();
        warehouse.setUsedUnits(used);
        return warehouse;
    }
}
