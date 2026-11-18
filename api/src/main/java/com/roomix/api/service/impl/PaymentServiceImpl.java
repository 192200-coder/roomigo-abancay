package com.roomix.api.service.impl;

import com.roomix.api.dto.response.CheckoutResponseDto;
import com.roomix.api.dto.response.PaymentStatusDto;
import com.roomix.api.entity.Payment;
import com.roomix.api.entity.Reservation;
import com.roomix.api.entity.Room;
import com.roomix.api.entity.enums.PaymentPurpose;
import com.roomix.api.entity.enums.PaymentStatus;
import com.roomix.api.entity.enums.ReservationStatus;
import com.roomix.api.exception.BadRequestException;
import com.roomix.api.exception.ConflictException;
import com.roomix.api.exception.ResourceNotFoundException;
import com.roomix.api.payment.MercadoPagoClient;
import com.roomix.api.payment.MercadoPagoModels.BackUrls;
import com.roomix.api.payment.MercadoPagoModels.Item;
import com.roomix.api.payment.MercadoPagoModels.PaymentInfo;
import com.roomix.api.payment.MercadoPagoModels.PreferenceRequest;
import com.roomix.api.payment.MercadoPagoModels.PreferenceResponse;
import com.roomix.api.payment.MercadoPagoProperties;
import com.roomix.api.payment.PaymentReconciler;
import com.roomix.api.repository.PaymentRepository;
import com.roomix.api.repository.ReservationRepository;
import com.roomix.api.repository.RoomRepository;
import com.roomix.api.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private static final BigDecimal DEFAULT_PUBLICATION_FEE = new BigDecimal("15.00");
    private static final String RETURN_PATH = "/?pago=resultado";

    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final PaymentRepository paymentRepository;
    private final MercadoPagoClient mercadoPago;
    private final MercadoPagoProperties properties;
    private final PaymentReconciler reconciler;

    @Override
    @Transactional
    public CheckoutResponseDto startBookingCheckout(Long reservationId, String tenantEmail) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada"));
        if (!reservation.getTenant().getEmail().equalsIgnoreCase(tenantEmail)) {
            throw new AccessDeniedException("Solo el inquilino de la reserva puede pagarla.");
        }
        if (reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new BadRequestException("Solo puedes pagar una reserva aprobada por el propietario.");
        }

        Payment payment = paymentRepository.findByReservationId(reservationId)
                .orElseGet(() -> Payment.builder()
                        .purpose(PaymentPurpose.BOOKING)
                        .reservation(reservation)
                        .externalReference("BOOKING-" + reservationId)
                        .paymentMethod("MERCADO_PAGO")
                        .build());
        ensureNotPaid(payment, "Esta reserva ya fue pagada.");
        payment.setAmount(reservation.getInitialPayment());

        Room room = reservation.getRoom();
        String months = reservation.getMonths() + (reservation.getMonths() == 1 ? " mes" : " meses");
        Item item = new Item(payment.getExternalReference(),
                "Reserva: " + room.getTitle(),
                "Primer mes + depósito. Contrato de " + months + " desde " + reservation.getStartDate(),
                1, payment.getCurrency(), payment.getAmount());

        return checkout(payment, item);
    }

    @Override
    @Transactional
    public CheckoutResponseDto startPublicationCheckout(Long roomId, String ownerEmail) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Habitación no encontrada"));
        if (!room.getProperty().getOwner().getEmail().equalsIgnoreCase(ownerEmail)) {
            throw new AccessDeniedException("Solo el propietario puede pagar la publicación de este cuarto.");
        }
        if (room.isPublicationFeePaid()) {
            throw new ConflictException("La publicación de este cuarto ya está pagada.");
        }

        Payment payment = paymentRepository.findByRoomId(roomId)
                .orElseGet(() -> Payment.builder()
                        .purpose(PaymentPurpose.ROOM_PUBLICATION)
                        .room(room)
                        .externalReference("PUBLICATION-" + roomId)
                        .paymentMethod("MERCADO_PAGO")
                        .build());
        ensureNotPaid(payment, "La publicación de este cuarto ya está pagada.");
        payment.setAmount(room.getPublicationFeeAmount() != null ? room.getPublicationFeeAmount() : DEFAULT_PUBLICATION_FEE);

        Item item = new Item(payment.getExternalReference(),
                "Publicación: " + room.getTitle(),
                "Tarifa de publicación en RoomiGo Abancay",
                1, payment.getCurrency(), payment.getAmount());

        return checkout(payment, item);
    }

    @Override
    public PaymentStatusDto confirmReturn(String providerPaymentId, String userEmail) {
        PaymentInfo info = mercadoPago.getPayment(requireNumericId(providerPaymentId));
        PaymentReconciler.Result result = reconciler.apply(info)
                .orElseThrow(() -> new ResourceNotFoundException("El pago no corresponde a ninguna operación de RoomiGo."));
        boolean allowed = result.allowedEmails().stream().anyMatch(e -> e.equalsIgnoreCase(userEmail));
        if (!allowed) {
            throw new AccessDeniedException("No tienes permiso para ver este pago.");
        }
        return result.status();
    }

    @Override
    public void handlePaymentNotification(String providerPaymentId) {
        PaymentInfo info = mercadoPago.getPayment(requireNumericId(providerPaymentId));
        reconciler.apply(info);
    }

    private CheckoutResponseDto checkout(Payment payment, Item item) {
        String base = trimTrailingSlash(properties.backUrlBase());
        String returnUrl = base + RETURN_PATH;
        boolean https = properties.isHttps(base);

        PreferenceRequest request = new PreferenceRequest(
                java.util.List.of(item),
                payment.getExternalReference(),
                new BackUrls(returnUrl, returnUrl, returnUrl),
                https ? "approved" : null, // Mercado Pago rechaza auto_return sin HTTPS
                properties.isHttps(properties.webhookUrl()) ? properties.webhookUrl() : null,
                properties.statementDescriptor(),
                Map.of("purpose", payment.getPurpose().name()));

        PreferenceResponse preference = mercadoPago.createPreference(request,
                payment.getExternalReference() + "-" + UUID.randomUUID());

        payment.setPreferenceId(preference.id());
        if (payment.getStatus() == PaymentStatus.FAILED) {
            payment.setStatus(PaymentStatus.PENDING); // nuevo intento tras un rechazo
        }
        Payment saved = paymentRepository.save(payment);

        String checkoutUrl = preference.initPoint() != null ? preference.initPoint() : preference.sandboxInitPoint();
        log.info("Checkout Pro creado para {} ({} {}).", saved.getExternalReference(), saved.getAmount(), saved.getCurrency());
        return CheckoutResponseDto.builder()
                .paymentId(saved.getId())
                .purpose(saved.getPurpose())
                .preferenceId(preference.id())
                .checkoutUrl(checkoutUrl)
                .amount(saved.getAmount())
                .currency(saved.getCurrency())
                .build();
    }

    private static void ensureNotPaid(Payment payment, String message) {
        if (payment.getStatus() == PaymentStatus.COMPLETED) {
            throw new ConflictException(message);
        }
    }

    /** Los ids de pago de Mercado Pago son numéricos; evita usar el valor en la URL si no lo es. */
    private static String requireNumericId(String id) {
        if (id == null || !id.matches("\\d{1,20}")) {
            throw new BadRequestException("Identificador de pago no válido.");
        }
        return id;
    }

    private static String trimTrailingSlash(String url) {
        return url == null ? "" : url.replaceAll("/+$", "");
    }
}
