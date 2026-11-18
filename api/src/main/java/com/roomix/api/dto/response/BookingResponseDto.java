package com.roomix.api.dto.response;

import com.roomix.api.entity.enums.PaymentStatus;
import com.roomix.api.entity.enums.ReservationStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponseDto {

    private Long id;
    private RoomResponseDto room;
    private UserResponseDto tenant;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer months;
    private BigDecimal totalPrice;
    /** Primer mes + depósito: lo que se cobra al pagar la reserva aprobada. */
    private BigDecimal initialPayment;
    /** Estado del pago por Mercado Pago (null si aún no se inició). */
    private PaymentStatus paymentStatus;
    private ReservationStatus status;
    private String notes;
    private LocalDateTime createdAt;
}
