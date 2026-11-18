package com.roomix.api.dto.response;

import com.roomix.api.entity.enums.PaymentPurpose;
import com.roomix.api.entity.enums.PaymentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Estado de un pago tras conciliarlo con Mercado Pago. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentStatusDto {
    private Long paymentId;
    private PaymentPurpose purpose;
    private Long reservationId;
    private Long roomId;
    private String concept;
    private PaymentStatus status;
    private String statusDetail;
    private BigDecimal amount;
    private String currency;
    private String paymentMethod;
    /** Número de operación en Mercado Pago. */
    private String providerPaymentId;
    private LocalDateTime paidAt;
}
