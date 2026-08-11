package com.nexora.repository;

import com.nexora.entity.RawMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RawMaterialRepository extends JpaRepository<RawMaterial, String> {
    List<RawMaterial> findByCompanyId(String companyId);
}
