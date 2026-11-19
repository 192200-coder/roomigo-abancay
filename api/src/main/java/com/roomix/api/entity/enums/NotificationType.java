package com.roomix.api.entity.enums;

/** Tipos de notificación. El frontend decide a qué sección llevar al usuario según el tipo. */
public enum NotificationType {
    /** Propietario: llegó una nueva solicitud de reserva. */
    BOOKING_REQUEST,
    /** Inquilino: el propietario aprobó la reserva (ya puede pagar). */
    BOOKING_APPROVED,
    /** Inquilino: el propietario rechazó la reserva. */
    BOOKING_REJECTED,
    /** Propietario: el inquilino canceló la reserva. */
    BOOKING_CANCELLED,
    /** Inquilino: su pago inicial fue acreditado. */
    PAYMENT_CONFIRMED,
    /** Propietario: recibió el pago inicial de una reserva. */
    PAYMENT_RECEIVED,
    /** Propietario: se acreditó la tarifa de publicación. */
    PUBLICATION_PAID,
    /** Propietario: el administrador aprobó su cuarto. */
    ROOM_APPROVED,
    /** Propietario: el administrador rechazó su cuarto. */
    ROOM_REJECTED,
    /** Propietario: un inquilino calificó su cuarto. */
    REVIEW_RECEIVED,
    /** Propietario: alguien pidió visitar una publicación en venta. */
    VISIT_REQUESTED,
    /** Interesado: el propietario confirmó la visita. */
    VISIT_CONFIRMED,
    /** Interesado: el propietario no puede recibir la visita en esa fecha. */
    VISIT_DECLINED,
    /** Propietario o interesado: el otro canceló la visita. */
    VISIT_CANCELLED
}
