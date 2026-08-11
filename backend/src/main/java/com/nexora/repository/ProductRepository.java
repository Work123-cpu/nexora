package com.nexora.repository;

import com.nexora.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, String> {
    List<Product> findByCompanyId(String companyId);
}
