package com.roomix.api.payment;

import com.roomix.api.dto.response.PaymentStatusDto;
import com.roomix.api.entity.Payment;
import com.roomix.api.entity.Room;
import com.roomix.api.entity.enums.PaymentPurpose;
import com.roomix.api.entity.enums.PaymentStatus;
import com.roomix.api.entity.enums.RoomStatus;
import com.roomix.api.payment.MercadoPagoModels.PaymentInfo;
import com.roomix.api.repository.PaymentRepository;
import com.roomix.api.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.Set;

/**
 * Aplica a la base de datos el estado de un pago informado por Mercado Pago.
 *
 * <p>Es la única pieza que cambia el estado de un pago, la use el webhook o la vuelta del
 * comprador. Reglas:
 * <ul>
 *   <li>Idempotente: procesar dos veces el mismo pago no repite efectos.</li>
 *   <li>Un pago COMPLETED no retrocede (p. ej. un intento rechazado anterior que llega tarde);
 *       solo puede pasar a REFUNDED.</li>
 *   <li>Solo se acepta como COMPLETED si el monto y la moneda coinciden con lo esperado.</li>
 * </ul>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentReconciler {

    private static final ZoneId LIMA = ZoneId.of("America/Lima");

    private final PaymentRepository paymentRepository;
    private final RoomRepository roomRepository;
    private final ApplicationEventPublisher events;

    /** Resultado de la conciliación más los correos autorizados a ver el pago. */
    public record Result(PaymentStatusDto status, Set<String> allowedEmails) {
    }

    @Transactional
    public Optional<Result> apply(PaymentInfo info) {
        if (info == null || info.externalReference() == null) {
            log.warn("Pago de Mercado Pago sin external_reference; se ignora.");
            return Optional.empty();
        }
        Optional<Payment> found = paymentRepository.findByExternalReferenceForUpdate(info.externalReference());
        if (found.isEmpty()) {
            log.warn("Pago de Mercado Pago {} con referencia desconocida {}; se ignora.", info.id(), info.externalReference());
            return Optional.empty();
        }
        Payment payment = found.get();
        PaymentStatus previous = payment.getStatus();
        PaymentStatus incoming = mapStatus(info.status());
        String detail = info.statusDetail();

        if (incoming == PaymentStatus.COMPLETED && !amountMatches(payment, info)) {
            log.error("Monto/moneda no coinciden para {}: esperado {} {}, recibido {} {} (pago MP {}). Requiere revisión.",
                    payment.getExternalReference(), payment.getAmount(), payment.getCurrency(),
                    info.transactionAmount(), info.currencyId(), info.id());
            incoming = PaymentStatus.FAILED;
            detail = "monto_no_coincide";
        }

        boolean locked = previous == PaymentStatus.COMPLETED && incoming != PaymentStatus.REFUNDED;
        if (locked || previous == PaymentStatus.REFUNDED) {
            // Ya pagado (o reembolsado): ignorar notificaciones tardías de otros intentos.
            return Optional.of(describe(payment));
        }

        payment.setStatus(incoming);
        payment.setStatusDetail(detail);
        payment.setProviderPaymentId(String.valueOf(info.id()));
        if (info.paymentMethodId() != null) {
            payment.setPaymentMethod(info.paymentMethodId());
        }

        if (incoming == PaymentStatus.COMPLETED) {
            payment.setPaidAt(info.dateApproved() != null
                    ? info.dateApproved().atZoneSameInstant(LIMA).toLocalDateTime()
                    : LocalDateTime.now(LIMA));
            applyCompletedEffects(payment);
            log.info("Pago {} acreditado (MP {}, {} {}).", payment.getExternalReference(), info.id(),
                    payment.getAmount(), payment.getCurrency());
        } else if (incoming == PaymentStatus.REFUNDED && previous == PaymentStatus.COMPLETED) {
            revertCompletedEffects(payment);
            log.warn("Pago {} reembolsado (MP {}).", payment.getExternalReference(), info.id());
        }

        paymentRepository.save(payment);

        if (incoming == PaymentStatus.COMPLETED) {
            events.publishEvent(new PaymentCompletedEvent(payment.getId(), payment.getPurpose(),
                    payment.getReservation() != null ? payment.getReservation().getId() : null,
                    payment.getRoom() != null ? payment.getRoom().getId() : null));
        }
        return Optional.of(describe(payment));
    }

    /** Estados de Mercado Pago -> estados internos. */
    static PaymentStatus mapStatus(String mpStatus) {
        if (mpStatus == null) return PaymentStatus.PENDING;
        return switch (mpStatus) {
            case "approved" -> PaymentStatus.COMPLETED;
            case "rejected", "cancelled" -> PaymentStatus.FAILED;
            case "refunded", "charged_back" -> PaymentStatus.REFUNDED;
            default -> PaymentStatus.PENDING; // pending, in_process, authorized, in_mediation
        };
    }

    private static boolean amountMatches(Payment payment, PaymentInfo info) {
        return info.transactionAmount() != null
                && info.transactionAmount().compareTo(payment.getAmount()) == 0
                && payment.getCurrency().equalsIgnoreCase(info.currencyId());
    }

    private void applyCompletedEffects(Payment payment) {
        if (payment.getPurpose() == PaymentPurpose.BOOKING) {
            Room room = payment.getReservation().getRoom();
            room.setStatus(RoomStatus.RENTED);
            roomRepository.save(room);
        } else {
            Room room = payment.getRoom();
            room.setPublicationFeePaid(true);
            room.setPaymentMethod("MERCADO_PAGO");
            room.setPaymentReference(payment.getProviderPaymentId());
            roomRepository.save(room);
        }
    }

    private void revertCompletedEffects(Payment payment) {
        if (payment.getPurpose() == PaymentPurpose.BOOKING) {
            Room room = payment.getReservation().getRoom();
            if (room.getStatus() == RoomStatus.RENTED) {
                room.setStatus(RoomStatus.AVAILABLE);
                roomRepository.save(room);
            }
        } else {
            Room room = payment.getRoom();
            room.setPublicationFeePaid(false);
            roomRepository.save(room);
        }
    }

    /** Debe llamarse dentro de una transacción (navega relaciones LAZY). */
    public static Result describe(Payment payment) {
        boolean booking = payment.getPurpose() == PaymentPurpose.BOOKING;
        Room room = booking ? payment.getReservation().getRoom() : payment.getRoom();
        String ownerEmail = room.getProperty().getOwner().getEmail();
        Set<String> allowed = booking
                ? Set.of(payment.getReservation().getTenant().getEmail(), ownerEmail)
                : Set.of(ownerEmail);
        PaymentStatusDto dto = PaymentStatusDto.builder()
                .paymentId(payment.getId())
                .purpose(payment.getPurpose())
                .reservationId(booking ? payment.getReservation().getId() : null)
                .roomId(room.getId())
                .concept(booking ? "Reserva: " + room.getTitle() : "Publicación: " + room.getTitle())
                .status(payment.getStatus())
                .statusDetail(payment.getStatusDetail())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .paymentMethod(payment.getPaymentMethod())
                .providerPaymentId(payment.getProviderPaymentId())
                .paidAt(payment.getPaidAt())
                .build();
        return new Result(dto, allowed);
    }
}
