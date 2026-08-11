package com.nexora.service;

import com.nexora.dto.BomInput;
import com.nexora.entity.BillOfMaterials;
import com.nexora.entity.BomLineItem;
import com.nexora.exception.ResourceNotFoundException;
import com.nexora.repository.BillOfMaterialsRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class BomService {

    private final BillOfMaterialsRepository repository;

    public BomService(BillOfMaterialsRepository repository) {
        this.repository = repository;
    }

    public List<BillOfMaterials> list(String companyId) {
        return repository.findByCompanyId(companyId);
    }

    public BillOfMaterials get(String companyId, String id) {
        BillOfMaterials bom = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BOM not found: " + id));
        if (!bom.getCompanyId().equals(companyId)) {
            throw new ResourceNotFoundException("BOM not found: " + id);
        }
        return bom;
    }

    public BillOfMaterials create(String companyId, BomInput input) {
        BillOfMaterials bom = new BillOfMaterials();
        bom.setCompanyId(companyId);
        apply(bom, input);
        return repository.save(bom);
    }

    public BillOfMaterials update(String companyId, String id, BomInput input) {
        BillOfMaterials bom = get(companyId, id);
        apply(bom, input);
        bom.setUpdatedAt(Instant.now());
        return repository.save(bom);
    }

    public void delete(String companyId, String id) {
        repository.delete(get(companyId, id));
    }

    private void apply(BillOfMaterials bom, BomInput input) {
        bom.setProductId(input.productId());
        bom.setVersion(input.version() != null ? input.version() : "v1.0");
        bom.setLaborCostPerUnit(input.laborCostPerUnit());
        bom.setOverheadCostPerUnit(input.overheadCostPerUnit());
        bom.setNotes(input.notes());

        List<BomLineItem> lines = new ArrayList<>();
        if (input.materials() != null) {
            input.materials().forEach(m -> {
                BomLineItem line = new BomLineItem();
                line.setRawMaterialId(m.rawMaterialId());
                line.setQuantityPerUnit(m.quantityPerUnit());
                line.setUnit(m.unit());
                line.setScrapPct(m.scrapPct());
                lines.add(line);
            });
        }
        bom.setMaterials(lines);
    }
}
