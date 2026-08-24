package com.nexora.service;

import com.nexora.dto.RawMaterialInput;
import com.nexora.entity.RawMaterial;
import com.nexora.exception.ResourceNotFoundException;
import com.nexora.repository.RawMaterialRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RawMaterialService {

    private final RawMaterialRepository repository;
    private final MaterialIntelligenceService materialIntelligenceService;

    public RawMaterialService(RawMaterialRepository repository, MaterialIntelligenceService materialIntelligenceService) {
        this.repository = repository;
        this.materialIntelligenceService = materialIntelligenceService;
    }

    public List<RawMaterial> list(String companyId) {
        return repository.findByCompanyId(companyId);
    }

    public RawMaterial get(String companyId, String id) {
        RawMaterial material = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Raw material not found: " + id));
        if (!material.getCompanyId().equals(companyId)) {
            throw new ResourceNotFoundException("Raw material not found: " + id);
        }
        return material;
    }

    public RawMaterial create(String companyId, RawMaterialInput input) {
        RawMaterial material = new RawMaterial();
        material.setCompanyId(companyId);
        apply(material, input);
        RawMaterial saved = repository.save(material);
        // Fire-and-forget — classification happens in the background so this create request
        // (including each row of a CSV bulk import) isn't slowed down by a Groq round-trip.
        materialIntelligenceService.classifyAsync(saved);
        return saved;
    }

    public RawMaterial update(String companyId, String id, RawMaterialInput input) {
        RawMaterial material = get(companyId, id);
        apply(material, input);
        return repository.save(material);
    }

    public void delete(String companyId, String id) {
        repository.delete(get(companyId, id));
    }

    private void apply(RawMaterial material, RawMaterialInput input) {
        material.setCode(input.code());
        material.setName(input.name());
        material.setCategory(input.category());
        material.setUnit(input.unit());
        material.setUnitCost(input.unitCost());
        material.setLeadTimeDays(input.leadTimeDays());
        material.setPerishable(input.isPerishable());
        material.setPrimaryVendorId(input.primaryVendorId());
        material.setStatus(input.status() != null ? input.status() : "active");
    }
}
