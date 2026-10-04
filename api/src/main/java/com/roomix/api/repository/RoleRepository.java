package com.roomix.api.repository;

import com.roomix.api.entity.Role;
import com.roomix.api.entity.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {
    Optional<Role> findByName(UserRole name);
}
