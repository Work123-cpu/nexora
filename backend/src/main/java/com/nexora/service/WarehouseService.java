package com.nexora.service;

import com.nexora.dto.WarehouseInput;
import com.nexora.entity.Warehouse;
import com.nexora.exception.ResourceNotFoundException;
import com.nexora.repository.WarehouseRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WarehouseService {

    private final WarehouseRepository repository;

    public WarehouseService(WarehouseRepository repository) {
        this.repository = repository;
    }

    public List<Warehouse> list(String companyId) {
        return repository.findByCompanyId(companyId);
    }

    public Warehouse get(String companyId, String id) {
        Warehouse warehouse = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found: " + id));
        if (!warehouse.getCompanyId().equals(companyId)) {
            throw new ResourceNotFoundException("Warehouse not found: " + id);
        }
        return warehouse;
    }

    public Warehouse create(String companyId, WarehouseInput input) {
        Warehouse warehouse = new Warehouse();
        warehouse.setCompanyId(companyId);
        apply(warehouse, input);
        return repository.save(warehouse);
    }

    public Warehouse update(String companyId, String id, WarehouseInput input) {
        Warehouse warehouse = get(companyId, id);
        apply(warehouse, input);
        return repository.save(warehouse);
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
        warehouse.setUsedUnits(input.usedUnits());
        warehouse.setStatus(input.status() != null ? input.status() : "operational");
    }
}
