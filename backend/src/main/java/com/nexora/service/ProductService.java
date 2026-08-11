package com.nexora.service;

import com.nexora.dto.ProductInput;
import com.nexora.entity.Product;
import com.nexora.entity.ProductStatus;
import com.nexora.exception.ResourceNotFoundException;
import com.nexora.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class ProductService {

    private final ProductRepository repository;

    public ProductService(ProductRepository repository) {
        this.repository = repository;
    }

    public List<Product> list(String companyId) {
        return repository.findByCompanyId(companyId);
    }

    public Product get(String companyId, String id) {
        Product product = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        assertOwnership(product, companyId);
        return product;
    }

    public Product create(String companyId, ProductInput input) {
        Product product = new Product();
        product.setCompanyId(companyId);
        product.setSku("SKU-" + ThreadLocalRandom.current().nextInt(1000, 10000));
        apply(product, input);
        return repository.save(product);
    }

    public Product update(String companyId, String id, ProductInput input) {
        Product product = get(companyId, id);
        apply(product, input);
        product.setUpdatedAt(Instant.now());
        return repository.save(product);
    }

    public void delete(String companyId, String id) {
        Product product = get(companyId, id);
        repository.delete(product);
    }

    private void apply(Product product, ProductInput input) {
        product.setName(input.name());
        product.setCategory(input.category());
        product.setDescription(input.description());
        product.setUnitOfMeasure(input.unitOfMeasure());
        product.setUnitPrice(input.unitPrice());
        product.setUnitCost(input.unitCost());
        product.setStatus(input.status() != null ? input.status() : ProductStatus.ACTIVE);
    }

    private void assertOwnership(Product product, String companyId) {
        if (!product.getCompanyId().equals(companyId)) {
            throw new ResourceNotFoundException("Product not found");
        }
    }
}
