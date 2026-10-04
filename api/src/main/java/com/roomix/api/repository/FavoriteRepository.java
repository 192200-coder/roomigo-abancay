package com.roomix.api.repository;

import com.roomix.api.entity.Favorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    Optional<Favorite> findByUserIdAndRoomId(Long userId, Long roomId);
    boolean existsByUserIdAndRoomId(Long userId, Long roomId);
    Page<Favorite> findByUserId(Long userId, Pageable pageable);
    void deleteByUserIdAndRoomId(Long userId, Long roomId);
}