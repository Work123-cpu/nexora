package com.nexora.repository;

import com.nexora.entity.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VendorRepository extends JpaRepository<Vendor, String> {
    List<Vendor> findByCompanyId(String companyId);
}
