package com.roomix.api.repository;

import com.roomix.api.entity.Reservation;
import com.roomix.api.entity.enums.ReservationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    // IMPLEMENTACIÓN DE REGLA DE NEGOCIO RN-002: Verificación estricta de traslape de fechas
    @Query("SELECT COUNT(r) > 0 FROM Reservation r " +
            "WHERE r.room.id = :roomId " +
            "AND r.status IN ('PENDING', 'CONFIRMED') " +
            "AND r.startDate < :endDate " +
            "AND r.endDate > :startDate")
    boolean existsOverlappingReservation(
            @Param("roomId") Long roomId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    Page<Reservation> findByTenantId(Long tenantId, Pageable pageable);
    List<Reservation> findByTenantId(Long tenantId);

    Page<Reservation> findByRoomPropertyOwnerId(Long ownerId, Pageable pageable);
    List<Reservation> findByRoomPropertyOwnerId(Long ownerId);

    List<Reservation> findByRoomId(Long roomId);

    List<Reservation> findByRoomPropertyOwnerIdAndStatus(Long ownerId, ReservationStatus status);

    @Query("SELECT COALESCE(SUM(r.totalPrice), 0) FROM Reservation r " +
            "WHERE r.room.property.owner.id = :ownerId AND r.status = 'CONFIRMED'")
    BigDecimal calculateTotalEarningsByOwner(@Param("ownerId") Long ownerId);

    long countByRoomPropertyOwnerIdAndStatus(Long ownerId, ReservationStatus status);
}