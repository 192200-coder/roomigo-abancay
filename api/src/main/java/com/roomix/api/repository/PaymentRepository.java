package com.roomix.api.repository;

import com.roomix.api.entity.Payment;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByReservationId(Long reservationId);

    Optional<Payment> findByRoomId(Long roomId);

    Optional<Payment> findByExternalReference(String externalReference);

    /**
     * Bloquea la fila mientras se concilia: el webhook y la vuelta del comprador pueden
     * llegar a la vez y no deben aplicar los efectos del pago dos veces.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Payment p where p.externalReference = :ref")
    Optional<Payment> findByExternalReferenceForUpdate(@Param("ref") String externalReference);
}
