package com.nexora.repository;

import com.nexora.entity.DataMode;
import com.nexora.entity.RawMaterialIntelligence;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RawMaterialIntelligenceRepository extends JpaRepository<RawMaterialIntelligence, String> {
    Optional<RawMaterialIntelligence> findByRawMaterialId(String rawMaterialId);
    List<RawMaterialIntelligence> findByCompanyId(String companyId);
    List<RawMaterialIntelligence> findByCompanyIdAndDataMode(String companyId, DataMode dataMode);
}
