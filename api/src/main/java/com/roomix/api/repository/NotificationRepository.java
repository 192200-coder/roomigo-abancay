package com.roomix.api.repository;

import com.roomix.api.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUserIdOrderByCreatedAtDescIdDesc(Long userId, Pageable pageable);

    long countByUserIdAndIsReadFalse(Long userId);

    /** Busca una notificación solo si pertenece al usuario (evita leer o marcar las de otros). */
    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    @Modifying
    @Query("update Notification n set n.isRead = true where n.user.id = :userId and n.isRead = false")
    int markAllAsRead(@Param("userId") Long userId);
}
