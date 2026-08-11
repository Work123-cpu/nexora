package com.nexora.service;

import com.nexora.dto.VendorInput;
import com.nexora.entity.Vendor;
import com.nexora.exception.ResourceNotFoundException;
import com.nexora.repository.VendorRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class VendorService {

    private final VendorRepository repository;

    public VendorService(VendorRepository repository) {
        this.repository = repository;
    }

    public List<Vendor> list(String companyId) {
        return repository.findByCompanyId(companyId);
    }

    public Vendor get(String companyId, String id) {
        Vendor vendor = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found: " + id));
        if (!vendor.getCompanyId().equals(companyId)) {
            throw new ResourceNotFoundException("Vendor not found: " + id);
        }
        return vendor;
    }

    public Vendor create(String companyId, VendorInput input) {
        Vendor vendor = new Vendor();
        vendor.setCompanyId(companyId);
        apply(vendor, input);
        return repository.save(vendor);
    }

    public Vendor update(String companyId, String id, VendorInput input) {
        Vendor vendor = get(companyId, id);
        apply(vendor, input);
        return repository.save(vendor);
    }

    public void delete(String companyId, String id) {
        repository.delete(get(companyId, id));
    }

    private void apply(Vendor vendor, VendorInput input) {
        vendor.setName(input.name());
        vendor.setCategory(input.category());
        vendor.setContactName(input.contactName());
        vendor.setEmail(input.email());
        vendor.setPhone(input.phone());
        vendor.setCity(input.city());
        vendor.setCountry(input.country());
        vendor.setRating(input.rating());
        vendor.setOnTimeDeliveryPct(input.onTimeDeliveryPct());
        vendor.setQualityScorePct(input.qualityScorePct());
        vendor.setLeadTimeDays(input.leadTimeDays());
        vendor.setActiveContracts(input.activeContracts());
        vendor.setMaterialsSupplied(input.materialsSupplied() != null ? input.materialsSupplied() : new ArrayList<>());
        vendor.setStatus(input.status() != null ? input.status() : "active");
    }
}
