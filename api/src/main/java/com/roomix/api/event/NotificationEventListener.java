package com.roomix.api.event;

import com.roomix.api.entity.*;
import com.roomix.api.entity.enums.NotificationType;
import com.roomix.api.entity.enums.PaymentPurpose;
import com.roomix.api.payment.PaymentCompletedEvent;
import com.roomix.api.repository.PaymentRepository;
import com.roomix.api.repository.ReservationRepository;
import com.roomix.api.repository.ReviewRepository;
import com.roomix.api.repository.RoomRepository;
import com.roomix.api.repository.VisitRequestRepository;
import com.roomix.api.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Convierte eventos de dominio en notificaciones para los usuarios.
 *
 * <p>Se ejecuta DESPUÉS de confirmar la transacción que originó el evento (AFTER_COMMIT), en una
 * transacción propia: nunca se notifica algo que finalmente no se guardó, y un fallo al
 * notificar no revierte la operación principal (solo se registra en el log).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private static final Locale ES_PE = Locale.forLanguageTag("es-PE");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("d 'de' MMMM 'de' yyyy", ES_PE);
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm", ES_PE);

    private final NotificationService notifications;
    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final PaymentRepository paymentRepository;
    private final ReviewRepository reviewRepository;
    private final VisitRequestRepository visitRequestRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onBookingRequested(DomainEvents.BookingRequested event) {
        safely("BookingRequested", () -> reservationRepository.findById(event.reservationId()).ifPresent(r -> {
            User tenant = r.getTenant();
            notifications.notify(owner(r.getRoom()), NotificationType.BOOKING_REQUEST,
                    "Nueva solicitud para " + r.getRoom().getTitle(),
                    tenant.getFirstName() + " " + tenant.getLastName() + " quiere alquilar por " + months(r)
                            + " desde el " + DATE.format(r.getStartDate()) + ". Revísala en Solicitudes.");
        }));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onBookingStatusChanged(DomainEvents.BookingStatusChanged event) {
        safely("BookingStatusChanged", () -> reservationRepository.findById(event.reservationId()).ifPresent(r -> {
            String room = r.getRoom().getTitle();
            switch (event.status()) {
                case CONFIRMED -> notifications.notify(r.getTenant(), NotificationType.BOOKING_APPROVED,
                        "¡Tu reserva fue aprobada!",
                        "El propietario aprobó tu reserva de " + room + ". Paga " + money(r.getInitialPayment())
                                + " (primer mes + depósito) desde Mis reservas para asegurarla.");
                case REJECTED -> notifications.notify(r.getTenant(), NotificationType.BOOKING_REJECTED,
                        "Tu solicitud no fue aceptada",
                        "El propietario no aceptó tu solicitud para " + room + ". Puedes buscar otras opciones en Abancay.");
                case CANCELLED -> notifications.notify(owner(r.getRoom()), NotificationType.BOOKING_CANCELLED,
                        "Reserva cancelada",
                        "La reserva #" + r.getId() + " de " + room + " fue cancelada.");
                default -> { /* sin aviso */ }
            }
        }));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        safely("PaymentCompleted", () -> paymentRepository.findById(event.paymentId()).ifPresent(p -> {
            if (p.getPurpose() == PaymentPurpose.BOOKING) {
                Reservation r = p.getReservation();
                String room = r.getRoom().getTitle();
                notifications.notify(r.getTenant(), NotificationType.PAYMENT_CONFIRMED,
                        "Pago acreditado",
                        "Mercado Pago acreditó tu pago de " + money(p.getAmount()) + " por " + room
                                + ". Coordina la entrega de llaves con el propietario.");
                notifications.notify(owner(r.getRoom()), NotificationType.PAYMENT_RECEIVED,
                        "Recibiste un pago",
                        r.getTenant().getFirstName() + " pagó " + money(p.getAmount()) + " (primer mes + depósito) por "
                                + room + ". El cuarto quedó como alquilado.");
            } else {
                notifications.notify(owner(p.getRoom()), NotificationType.PUBLICATION_PAID,
                        "Tarifa de publicación pagada",
                        "Se acreditó el pago de " + money(p.getAmount()) + " por la publicación de " + p.getRoom().getTitle() + ".");
            }
        }));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onRoomModerated(DomainEvents.RoomModerated event) {
        safely("RoomModerated", () -> roomRepository.findById(event.roomId()).ifPresent(room -> {
            if (event.approved()) {
                notifications.notify(owner(room), NotificationType.ROOM_APPROVED,
                        "Tu publicación ya está visible",
                        room.getTitle() + " fue aprobado y ya aparece en las búsquedas de RoomiGo.");
            } else {
                String reason = event.reason() != null && !event.reason().isBlank() ? " Motivo: " + event.reason().trim() : "";
                notifications.notify(owner(room), NotificationType.ROOM_REJECTED,
                        "Tu publicación no fue aprobada",
                        room.getTitle() + " no fue aprobada por el administrador." + reason + " Puedes editarlo y volver a enviarlo.");
            }
        }));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onReviewCreated(DomainEvents.ReviewCreated event) {
        safely("ReviewCreated", () -> reviewRepository.findById(event.reviewId()).ifPresent(review -> {
            Room room = review.getRoom();
            notifications.notify(owner(room), NotificationType.REVIEW_RECEIVED,
                    "Nueva reseña: " + "★".repeat(Math.max(1, Math.min(5, review.getRating()))),
                    review.getUser().getFirstName() + " calificó " + room.getTitle() + " con " + review.getRating() + " de 5.");
        }));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onVisitRequested(DomainEvents.VisitRequested event) {
        safely("VisitRequested", () -> visitRequestRepository.findById(event.visitRequestId()).ifPresent(v -> {
            User requester = v.getRequester();
            notifications.notify(owner(v.getRoom()), NotificationType.VISIT_REQUESTED,
                    "Quieren visitar " + v.getRoom().getTitle(),
                    requester.getFirstName() + " " + requester.getLastName() + " propone visitarla el "
                            + DATE.format(v.getPreferredDate()) + visitTime(v) + ". Respóndele en Visitas.");
        }));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onVisitStatusChanged(DomainEvents.VisitStatusChanged event) {
        safely("VisitStatusChanged", () -> visitRequestRepository.findById(event.visitRequestId()).ifPresent(v -> {
            String room = v.getRoom().getTitle();
            String note = v.getOwnerNote() != null ? " Nota del propietario: " + v.getOwnerNote() : "";
            switch (event.status()) {
                case CONFIRMED -> notifications.notify(v.getRequester(), NotificationType.VISIT_CONFIRMED,
                        "Visita confirmada",
                        "El propietario te espera el " + DATE.format(v.getPreferredDate()) + visitTime(v) + " para ver "
                                + room + ". Ya puedes ver su teléfono en Mis visitas." + note);
                case DECLINED -> notifications.notify(v.getRequester(), NotificationType.VISIT_DECLINED,
                        "Visita no disponible",
                        "El propietario no puede recibirte en esa fecha para ver " + room + ". Puedes proponer otra." + note);
                case CANCELLED -> notifications.notify(event.byRequester() ? owner(v.getRoom()) : v.getRequester(),
                        NotificationType.VISIT_CANCELLED,
                        "Visita cancelada",
                        "Se canceló la visita del " + DATE.format(v.getPreferredDate()) + " a " + room + ".");
                default -> { /* sin aviso */ }
            }
        }));
    }

    private static String visitTime(VisitRequest v) {
        return v.getPreferredTime() != null ? " a las " + TIME.format(v.getPreferredTime()) : "";
    }

    private static User owner(Room room) {
        return room.getProperty().getOwner();
    }

    private static String months(Reservation r) {
        int m = r.getMonths() != null ? r.getMonths() : 1;
        return m + (m == 1 ? " mes" : " meses");
    }

    private static String money(BigDecimal amount) {
        NumberFormat format = NumberFormat.getNumberInstance(Locale.US);
        format.setMinimumFractionDigits(2);
        format.setMaximumFractionDigits(2);
        return "S/ " + format.format(amount != null ? amount : BigDecimal.ZERO);
    }

    private void safely(String event, Runnable action) {
        try {
            action.run();
        } catch (RuntimeException ex) {
            log.error("No se pudo generar la notificación de {}: {}", event, ex.getMessage(), ex);
        }
    }
}
