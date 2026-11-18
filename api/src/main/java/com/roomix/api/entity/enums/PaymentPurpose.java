package com.roomix.api.entity.enums;

/** Concepto de un pago. */
public enum PaymentPurpose {
    /** Pago inicial de una reserva aprobada: primer mes + depósito. */
    BOOKING,
    /** Tarifa de publicación de un cuarto por parte del propietario. */
    ROOM_PUBLICATION
}
