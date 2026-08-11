package com.nexora.repository;

import com.nexora.entity.BillOfMaterials;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BillOfMaterialsRepository extends JpaRepository<BillOfMaterials, String> {
    List<BillOfMaterials> findByCompanyId(String companyId);
    Optional<BillOfMaterials> findByCompanyIdAndProductId(String companyId, String productId);
}
