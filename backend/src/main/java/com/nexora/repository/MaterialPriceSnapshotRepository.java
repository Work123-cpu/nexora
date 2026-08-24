package com.nexora.repository;

import com.nexora.entity.MaterialPriceSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MaterialPriceSnapshotRepository extends JpaRepository<MaterialPriceSnapshot, String> {
    List<MaterialPriceSnapshot> findByRawMaterialIdOrderBySnapshotDateDesc(String rawMaterialId);
    List<MaterialPriceSnapshot> findTop30ByRawMaterialIdOrderBySnapshotDateDesc(String rawMaterialId);
    Optional<MaterialPriceSnapshot> findByRawMaterialIdAndSnapshotDate(String rawMaterialId, LocalDate snapshotDate);
}
