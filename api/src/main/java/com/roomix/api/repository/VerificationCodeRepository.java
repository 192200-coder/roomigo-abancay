package com.roomix.api.repository;

import com.roomix.api.entity.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {

    Optional<VerificationCode> findTopByEmailIgnoreCaseAndUsedFalseOrderByCreatedAtDesc(String email);

    Optional<VerificationCode> findTopByEmailIgnoreCaseAndCodeAndUsedFalseOrderByCreatedAtDesc(String email, String code);
}
