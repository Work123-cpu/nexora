package com.nexora.repository;

import com.nexora.entity.BillOfMaterials;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BillOfMaterialsRepository extends JpaRepository<BillOfMaterials, String> {
    List<BillOfMaterials> findByCompanyId(String companyId);
}
