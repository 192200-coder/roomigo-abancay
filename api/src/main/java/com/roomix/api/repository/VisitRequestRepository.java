package com.roomix.api.repository;

import com.roomix.api.entity.VisitRequest;
import com.roomix.api.entity.enums.VisitRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface VisitRequestRepository extends JpaRepository<VisitRequest, Long> {

    List<VisitRequest> findByRequesterIdOrderByCreatedAtDesc(Long requesterId);

    List<VisitRequest> findByRoomPropertyOwnerIdOrderByCreatedAtDesc(Long ownerId);

    /** Evita que un mismo interesado acumule pedidos abiertos para la misma publicación. */
    boolean existsByRoomIdAndRequesterIdAndStatusIn(Long roomId, Long requesterId, Collection<VisitRequestStatus> statuses);

    @Modifying
    @Query("DELETE FROM VisitRequest v WHERE v.room.id = :roomId")
    void deleteByRoomId(@Param("roomId") Long roomId);
}
