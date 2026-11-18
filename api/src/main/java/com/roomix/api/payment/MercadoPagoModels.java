package com.roomix.api.payment;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/** Modelos mínimos de la API REST de Mercado Pago que usa Roomix. */
public final class MercadoPagoModels {

    private MercadoPagoModels() {
    }

    /** Cuerpo de POST /checkout/preferences (Checkout Pro). */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record PreferenceRequest(
            List<Item> items,
            @JsonProperty("external_reference") String externalReference,
            @JsonProperty("back_urls") BackUrls backUrls,
            @JsonProperty("auto_return") String autoReturn,
            @JsonProperty("notification_url") String notificationUrl,
            @JsonProperty("statement_descriptor") String statementDescriptor,
            Map<String, Object> metadata
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Item(
            String id,
            String title,
            String description,
            Integer quantity,
            @JsonProperty("currency_id") String currencyId,
            @JsonProperty("unit_price") BigDecimal unitPrice
    ) {
    }

    public record BackUrls(String success, String failure, String pending) {
    }

    /** Respuesta de POST /checkout/preferences. */
    public record PreferenceResponse(
            String id,
            @JsonProperty("init_point") String initPoint,
            @JsonProperty("sandbox_init_point") String sandboxInitPoint
    ) {
    }

    /** Respuesta de GET /v1/payments/{id} (solo los campos que usamos). */
    public record PaymentInfo(
            Long id,
            String status,
            @JsonProperty("status_detail") String statusDetail,
            @JsonProperty("external_reference") String externalReference,
            @JsonProperty("transaction_amount") BigDecimal transactionAmount,
            @JsonProperty("currency_id") String currencyId,
            @JsonProperty("payment_method_id") String paymentMethodId,
            @JsonProperty("payment_type_id") String paymentTypeId,
            @JsonProperty("date_approved") OffsetDateTime dateApproved,
            @JsonProperty("live_mode") Boolean liveMode
    ) {
    }
}
