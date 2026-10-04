package com.roomix.api.repository;

import com.roomix.api.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByRoomId(Long roomId);
    Page<Review> findByRoomIdAndStatus(Long roomId, String status, Pageable pageable);
    boolean existsByReservationId(Long reservationId);

    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM Review r WHERE r.room.id = :roomId AND r.status = 'PUBLISHED'")
    Double getAverageRatingByRoomId(@Param("roomId") Long roomId);
}