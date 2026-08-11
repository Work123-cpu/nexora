package com.nexora.repository;

import com.nexora.entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {
    List<InventoryItem> findByCompanyId(String companyId);
    List<InventoryItem> findByCompanyIdAndWarehouseId(String companyId, String warehouseId);
    Optional<InventoryItem> findByCompanyIdAndItemTypeAndItemIdAndWarehouseId(String companyId, String itemType, String itemId, String warehouseId);
}
