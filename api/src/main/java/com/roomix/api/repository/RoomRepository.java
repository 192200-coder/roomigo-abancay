package com.roomix.api.repository;

import com.roomix.api.entity.Room;
import com.roomix.api.entity.enums.RoomStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long>, JpaSpecificationExecutor<Room> {

    Page<Room> findByPropertyOwnerId(Long ownerId, Pageable pageable);

    long countByPropertyOwnerId(Long ownerId);

    @Query("SELECT r FROM Room r " +
            "LEFT JOIN FETCH r.property p " +
            "LEFT JOIN FETCH r.images " +
            "LEFT JOIN FETCH r.amenities " +
            "WHERE r.id = :id")
    Optional<Room> findByIdWithDetails(@Param("id") Long id);

    long countByStatus(RoomStatus status);

    List<Room> findByStatusOrderByCreatedAtDesc(RoomStatus status);
}