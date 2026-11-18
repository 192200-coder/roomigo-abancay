package com.roomix.api.event;

import com.roomix.api.entity.enums.ReservationStatus;

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

    /** Un inquilino publicó una reseña. */
    public record ReviewCreated(Long reviewId) {
    }
}
