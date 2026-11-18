package com.roomix.api.payment;

import com.roomix.api.entity.enums.PaymentPurpose;

/**
 * Se publica una sola vez cuando un pago pasa a COMPLETED.
 * Pensado para notificaciones (Fase 4) u otros efectos desacoplados.
 */
public record PaymentCompletedEvent(Long paymentId, PaymentPurpose purpose, Long reservationId, Long roomId) {
}
