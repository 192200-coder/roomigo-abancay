package com.roomix.api.event;

import com.roomix.api.entity.enums.ReservationStatus;
import com.roomix.api.entity.enums.VisitRequestStatus;

/**
 * Eventos de dominio publicados por los servicios. Llevan solo ids: quien los consume
 * (p. ej. las notificaciones) vuelve a cargar los datos ya confirmados en la base.
 */
public final class DomainEvents {

    private DomainEvents() {
    }

    /** Un inquilino envió una solicitud de reserva. */
    public record BookingRequested(Long reservationId) {
    }

    /** El propietario aprobó, rechazó o canceló una reserva. */
    public record BookingStatusChanged(Long reservationId, ReservationStatus status) {
    }

    /** El administrador aprobó o rechazó la publicación de un cuarto. */
    public record RoomModerated(Long roomId, boolean approved, String reason) {
    }

    /** Un interesado pidió visitar una publicación en venta. */
    public record VisitRequested(Long visitRequestId) {
    }

    /**
     * Un pedido de visita fue confirmado, declinado o cancelado.
     * {@code byRequester} indica que lo canceló el propio interesado (se avisa al propietario).
     */
    public record VisitStatusChanged(Long visitRequestId, VisitRequestStatus status, boolean byRequester) {
    }

    /** Un inquilino publicó una reseña. */
    public record ReviewCreated(Long reviewId) {
    }
}
