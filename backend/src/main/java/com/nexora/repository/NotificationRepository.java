package com.nexora.repository;

import com.nexora.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByCompanyIdAndResolvedAtIsNullOrderByCreatedAtDesc(String companyId);
    Optional<Notification> findByCompanyIdAndEntityTypeAndEntityIdAndResolvedAtIsNull(String companyId, String entityType, String entityId);
}
