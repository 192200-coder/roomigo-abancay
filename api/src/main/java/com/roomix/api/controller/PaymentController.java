package com.roomix.api.controller;

import com.roomix.api.dto.common.ApiResponseDto;
import com.roomix.api.dto.request.MercadoPagoPaymentRequestDto;
import com.roomix.api.dto.response.MercadoPagoPaymentResponseDto;
import com.roomix.api.entity.Payment;
import com.roomix.api.entity.Reservation;
import com.roomix.api.entity.Room;
import com.roomix.api.entity.enums.PaymentStatus;
import com.roomix.api.entity.enums.ReservationStatus;
import com.roomix.api.entity.enums.RoomStatus;
import com.roomix.api.repository.PaymentRepository;
import com.roomix.api.repository.ReservationRepository;
import com.roomix.api.repository.RoomRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Pasarela Mercado Pago", description = "Endpoints de integración con Mercado Pago (Tarjetas, Yape, PagoEfectivo, Saldo MP)")
public class PaymentController {

    private boolean paymentProviderConfigured() {
        // La implementación actual solo genera respuestas simuladas; no procesa pagos reales.
        return false;
    }

    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final PaymentRepository paymentRepository;

    @GetMapping("/methods")
    @Operation(summary = "Obtener métodos de pago habilitados en Mercado Pago Perú")
    public ResponseEntity<ApiResponseDto<List<Map<String, Object>>>> getAvailableMethods() {
        List<Map<String, Object>> methods = List.of(
                Map.of("id", "CREDIT_CARD", "name", "Tarjetas de Crédito", "description", "Visa, Mastercard, AMEX hasta 12 cuotas", "badge", "Instantáneo"),
                Map.of("id", "DEBIT_CARD", "name", "Tarjetas de Débito", "description", "Visa Débito, Mastercard Débito", "badge", "Instantáneo"),
                Map.of("id", "YAPE", "name", "Yape con Mercado Pago", "description", "Aprobación directa con QR o código", "badge", "Sin comisiones"),
                Map.of("id", "PAGO_EFECTIVO", "name", "PagoEfectivo", "description", "Banca por internet (BCP, BBVA, Interbank) y agentes autorizados", "badge", "Código CIP"),
                Map.of("id", "WALLET", "name", "Saldo en Mercado Pago", "description", "1-clic con tu cuenta Mercado Pago", "badge", "Protegido")
        );
        return ResponseEntity.ok(ApiResponseDto.success("Métodos de pago Mercado Pago obtenidos", methods));
    }

    @PostMapping("/mercadopago/preference")
    @Operation(summary = "Crear preferencia de pago en Mercado Pago", description = "Genera preferenceId e initPoint para el Checkout de Mercado Pago.")
    public ResponseEntity<ApiResponseDto<MercadoPagoPaymentResponseDto>> createPreference(
            @RequestBody Map<String, Object> req) {
        if (!paymentProviderConfigured()) {
            throw new com.roomix.api.exception.BadRequestException("La pasarela de pagos todavía no está disponible.");
        }
        String title = (String) req.getOrDefault("title", "Alquiler RoomiGo Abancay");
        Object priceObj = req.get("unitPrice");
        java.math.BigDecimal amount = priceObj != null ? new java.math.BigDecimal(priceObj.toString()) : java.math.BigDecimal.valueOf(15.00);

        String prefId = "PREF-MP-" + System.currentTimeMillis() + "-" + (1000 + new Random().nextInt(9000));
        String initPoint = "https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=" + prefId;

        MercadoPagoPaymentResponseDto response = MercadoPagoPaymentResponseDto.builder()
                .preferenceId(prefId)
                .initPoint(initPoint)
                .transactionAmount(amount)
                .currency("PEN")
                .status("pending")
                .paymentMethod("Mercado Pago Checkout Pro")
                .build();

        return ResponseEntity.ok(ApiResponseDto.success("Preferencia de Mercado Pago creada con éxito", response));
    }

    @PostMapping("/mercadopago/process")
    @org.springframework.transaction.annotation.Transactional
    @Operation(summary = "Procesar pago completo con Mercado Pago", description = "Valida y acredita el pago mediante la API unificada de Mercado Pago.")
    public ResponseEntity<ApiResponseDto<MercadoPagoPaymentResponseDto>> processPayment(
            @Valid @RequestBody MercadoPagoPaymentRequestDto req,
            Authentication authentication) {

        if (!paymentProviderConfigured()) {
            throw new com.roomix.api.exception.BadRequestException("La pasarela de pagos todavía no está disponible.");
        }

        String userEmail = authentication != null ? authentication.getName() : req.getPayerEmail();
        log.info("Procesando pago Mercado Pago para: {}, Método: {}, Monto: {} PEN", userEmail, req.getSubMethod(), req.getAmount());

        long randomTxnSuffix = 1000000000L + (long)(new Random().nextDouble() * 8999999999L);
        String txnId = "MP-" + randomTxnSuffix;
        String authCode = "AUTH-" + (100000 + new Random().nextInt(900000));
        LocalDateTime now = LocalDateTime.now();

        String paymentMethodLabel;
        String paymentTypeId;
        String cipCode = null;
        String qrCode = null;

        switch (req.getSubMethod()) {
            case "CREDIT_CARD" -> {
                paymentMethodLabel = "Tarjeta de Crédito (Mercado Pago)";
                paymentTypeId = "credit_card";
            }
            case "DEBIT_CARD" -> {
                paymentMethodLabel = "Tarjeta de Débito (Mercado Pago)";
                paymentTypeId = "debit_card";
            }
            case "YAPE" -> {
                paymentMethodLabel = "Yape vía Mercado Pago";
                paymentTypeId = "digital_wallet";
                qrCode = "00020101021243650016com.mercadopago0214" + txnId + "520400005303604540" + req.getAmount() + "5802PE5915ROOMIGO_ABANCAY6007ABANCAY62070503***6304";
            }
            case "PAGO_EFECTIVO" -> {
                paymentMethodLabel = "PagoEfectivo CIP (Mercado Pago)";
                paymentTypeId = "bank_transfer";
                cipCode = "CIP-" + (10000000 + new Random().nextInt(90000000));
            }
            default -> {
                paymentMethodLabel = "Saldo Mercado Pago";
                paymentTypeId = "account_money";
            }
        }

        // Si el pago corresponde a una reserva de cuarto existente
        if ("BOOKING".equalsIgnoreCase(req.getEntityType()) && req.getEntityId() != null) {
            reservationRepository.findById(req.getEntityId()).ifPresent(reservation -> {
                reservation.setStatus(ReservationStatus.CONFIRMED);
                Room room = reservation.getRoom();
                if (room != null) {
                    room.setStatus(RoomStatus.RENTED);
                    roomRepository.save(room);
                }
                reservationRepository.save(reservation);

                Payment payment = Payment.builder()
                        .reservation(reservation)
                        .amount(req.getAmount())
                        .currency("PEN")
                        .paymentMethod("MERCADO_PAGO_" + req.getSubMethod())
                        .transactionCode(txnId)
                        .status(PaymentStatus.COMPLETED)
                        .paidAt(now)
                        .build();
                paymentRepository.save(payment);
            });
        }

        // Si el pago corresponde a la tarifa de publicación de habitación por propietario
        if ("ROOM_PUBLICATION".equalsIgnoreCase(req.getEntityType()) && req.getEntityId() != null) {
            roomRepository.findById(req.getEntityId()).ifPresent(room -> {
                room.setPublicationFeePaid(true);
                room.setPaymentMethod("MERCADO_PAGO_" + req.getSubMethod());
                room.setPaymentReference(txnId);
                roomRepository.save(room);
            });
        }

        MercadoPagoPaymentResponseDto response = MercadoPagoPaymentResponseDto.builder()
                .id(txnId)
                .status("approved")
                .statusDetail("accredited")
                .paymentMethod(paymentMethodLabel)
                .paymentTypeId(paymentTypeId)
                .transactionAmount(req.getAmount())
                .currency("PEN")
                .dateApproved(now)
                .authorizationCode(authCode)
                .cipCode(cipCode)
                .qrCode(qrCode)
                .receiptUrl("https://www.mercadopago.com.pe/comprobante/" + txnId)
                .build();

        return new ResponseEntity<>(ApiResponseDto.success("¡Pago acreditado exitosamente por Mercado Pago!", response), HttpStatus.OK);
    }

    @PostMapping("/mercadopago/webhook")
    @Operation(summary = "Webhook de notificaciones de Mercado Pago (IPN)")
    public ResponseEntity<Map<String, Object>> handleWebhook(@RequestBody(required = false) Map<String, Object> payload) {
        log.info("Webhook recibido de Mercado Pago: {}", payload);
        Map<String, Object> resp = new HashMap<>();
        resp.put("status", "received");
        resp.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(resp);
    }
}
