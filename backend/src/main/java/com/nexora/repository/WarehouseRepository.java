package com.nexora.repository;

import com.nexora.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WarehouseRepository extends JpaRepository<Warehouse, String> {
    List<Warehouse> findByCompanyId(String companyId);
}
