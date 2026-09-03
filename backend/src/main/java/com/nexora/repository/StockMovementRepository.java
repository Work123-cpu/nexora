package com.nexora.repository;

import com.nexora.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, String> {
    List<StockMovement> findByCompanyIdOrderByCreatedAtDesc(String companyId);
    List<StockMovement> findByCompanyIdAndItemIdOrderByCreatedAtDesc(String companyId, String itemId);
}
