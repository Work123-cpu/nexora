package com.nexora.repository;

import com.nexora.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, String> {
    List<PurchaseOrder> findByCompanyId(String companyId);
    List<PurchaseOrder> findByCompanyIdAndVendorId(String companyId, String vendorId);
}
