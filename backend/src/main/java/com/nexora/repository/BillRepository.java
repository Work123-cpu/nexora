package com.nexora.repository;

import com.nexora.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BillRepository extends JpaRepository<Bill, String> {
    List<Bill> findByCompanyId(String companyId);
}
