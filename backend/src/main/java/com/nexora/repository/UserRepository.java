package com.nexora.repository;

import com.nexora.entity.Role;
import com.nexora.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByCompanyId(String companyId);
    long countByCompanyIdAndRole(String companyId, Role role);
}
