package com.roomix.api.repository;

import com.roomix.api.entity.Property;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PropertyRepository extends JpaRepository<Property, Long> {
    Page<Property> findByOwnerId(Long ownerId, Pageable pageable);
    List<Property> findByOwnerId(Long ownerId);
}
