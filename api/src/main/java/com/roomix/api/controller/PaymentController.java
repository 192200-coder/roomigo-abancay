package com.roomix.api.controller;

import com.roomix.api.dto.common.ApiResponseDto;
import com.roomix.api.dto.response.CheckoutResponseDto;
import com.roomix.api.dto.response.PaymentStatusDto;
import com.roomix.api.exception.PaymentGatewayException;
import com.roomix.api.payment.WebhookSignatureValidator;
import com.roomix.api.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Pagos con Mercado Pago (Checkout Pro).
 *
 * <p>Flujo: el frontend pide un checkout, redirige al usuario a Mercado Pago y, al volver,
 * llama a /confirm. El webhook es la vía de respaldo (pagos que se acreditan más tarde,
 * pestañas cerradas). Ambas vías consultan el pago a la API de Mercado Pago antes de aplicarlo.
 */
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Pagos", description = "Integración con Mercado Pago Checkout Pro")
public class PaymentController {

    private final PaymentService paymentService;
    private final WebhookSignatureValidator signatureValidator;

    @PostMapping("/checkout/bookings/{reservationId}")
    @Operation(summary = "Iniciar el pago de una reserva aprobada (primer mes + depósito)")
    public ResponseEntity<ApiResponseDto<CheckoutResponseDto>> startBookingCheckout(
            @PathVariable Long reservationId, Authentication authentication) {
        CheckoutResponseDto checkout = paymentService.startBookingCheckout(reservationId, authentication.getName());
        return ResponseEntity.ok(ApiResponseDto.success("Checkout de Mercado Pago creado", checkout));
    }

    @PostMapping("/checkout/rooms/{roomId}/publication")
    @Operation(summary = "Iniciar el pago de la tarifa de publicación de un cuarto")
    public ResponseEntity<ApiResponseDto<CheckoutResponseDto>> startPublicationCheckout(
            @PathVariable Long roomId, Authentication authentication) {
        CheckoutResponseDto checkout = paymentService.startPublicationCheckout(roomId, authentication.getName());
        return ResponseEntity.ok(ApiResponseDto.success("Checkout de Mercado Pago creado", checkout));
    }

    @GetMapping("/mercadopago/confirm")
    @Operation(summary = "Confirmar un pago al volver de Checkout Pro",
            description = "Consulta el pago en Mercado Pago, lo concilia y devuelve su estado.")
    public ResponseEntity<ApiResponseDto<PaymentStatusDto>> confirmReturn(
            @RequestParam String paymentId, Authentication authentication) {
        PaymentStatusDto status = paymentService.confirmReturn(paymentId, authentication.getName());
        return ResponseEntity.ok(ApiResponseDto.success("Estado del pago actualizado", status));
    }

    /**
     * Webhook de Mercado Pago. Acepta el formato actual (type=payment&data.id=...) y el IPN
     * antiguo (topic=payment&id=...). Responde 2xx rápido; ante un fallo al consultar la API
     * responde 5xx para que Mercado Pago reintente.
     */
    @PostMapping("/mercadopago/webhook")
    @Operation(summary = "Webhook de notificaciones de Mercado Pago")
    public ResponseEntity<Map<String, Object>> handleWebhook(
            @RequestParam(name = "type", required = false) String type,
            @RequestParam(name = "topic", required = false) String topic,
            @RequestParam(name = "data.id", required = false) String queryDataId,
            @RequestParam(name = "id", required = false) String legacyId,
            @RequestHeader(name = "x-signature", required = false) String signature,
            @RequestHeader(name = "x-request-id", required = false) String requestId,
            @RequestBody(required = false) Map<String, Object> body) {

        String eventType = firstNonBlank(type, topic, body != null ? asString(body.get("type")) : null);
        String paymentId = firstNonBlank(queryDataId, bodyDataId(body), "payment".equals(topic) ? legacyId : null);

        if (!"payment".equals(eventType) || paymentId == null) {
            return ResponseEntity.ok(Map.of("status", "ignored"));
        }

        WebhookSignatureValidator.Result check = signatureValidator.validate(signature, requestId, queryDataId != null ? queryDataId : paymentId);
        if (check == WebhookSignatureValidator.Result.INVALID) {
            log.warn("Webhook de Mercado Pago con firma inválida para el pago {}; se rechaza.", paymentId);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("status", "invalid_signature"));
        }
        if (check == WebhookSignatureValidator.Result.MISSING) {
            log.info("Webhook de Mercado Pago sin firma verificable para el pago {}; se verifica consultando la API.", paymentId);
        }

        try {
            paymentService.handlePaymentNotification(paymentId);
        } catch (PaymentGatewayException ex) {
            log.warn("No se pudo procesar el webhook del pago {}: {}", paymentId, ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("status", "retry"));
        }
        return ResponseEntity.ok(Map.of("status", "processed"));
    }

    private static String bodyDataId(Map<String, Object> body) {
        if (body != null && body.get("data") instanceof Map<?, ?> data) {
            return asString(data.get("id"));
        }
        return null;
    }

    private static String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) return v;
        }
        return null;
    }
}
