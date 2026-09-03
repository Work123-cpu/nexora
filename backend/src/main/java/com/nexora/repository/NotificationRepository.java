package com.nexora.repository;

import com.nexora.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByCompanyIdAndResolvedAtIsNullOrderByCreatedAtDesc(String companyId);
    List<Notification> findByCompanyIdAndEntityTypeAndEntityIdAndResolvedAtIsNullOrderByCreatedAtDesc(String companyId, String entityType, String entityId);
}
