package com.roomix.api.payment;

import com.roomix.api.exception.PaymentGatewayException;
import com.roomix.api.exception.PaymentUnavailableException;
import com.roomix.api.payment.MercadoPagoModels.PaymentInfo;
import com.roomix.api.payment.MercadoPagoModels.PreferenceRequest;
import com.roomix.api.payment.MercadoPagoModels.PreferenceResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.net.http.HttpClient;
import java.time.Duration;

/**
 * Cliente HTTP de la API de Mercado Pago. Solo dos operaciones:
 * crear una preferencia de Checkout Pro y consultar un pago por su id.
 * El access token nunca sale del backend ni se registra en el log.
 */
@Component
@Slf4j
public class MercadoPagoClient {

    private final MercadoPagoProperties properties;
    private final RestClient restClient;

    public MercadoPagoClient(MercadoPagoProperties properties) {
        this.properties = properties;
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
        requestFactory.setReadTimeout(Duration.ofSeconds(15));
        this.restClient = RestClient.builder()
                .baseUrl(properties.apiBaseUrl())
                .requestFactory(requestFactory)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    /**
     * Crea una preferencia de Checkout Pro.
     *
     * @param idempotencyKey clave única por intento para que un reintento de red no duplique la preferencia
     */
    public PreferenceResponse createPreference(PreferenceRequest request, String idempotencyKey) {
        ensureConfigured();
        try {
            return restClient.post()
                    .uri("/checkout/preferences")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.accessToken())
                    .header("X-Idempotency-Key", idempotencyKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(PreferenceResponse.class);
        } catch (RestClientResponseException ex) {
            log.warn("Mercado Pago rechazó la preferencia {} -> HTTP {}: {}",
                    request.externalReference(), ex.getStatusCode().value(), ex.getResponseBodyAsString());
            throw new PaymentGatewayException("No se pudo iniciar el pago con Mercado Pago.", ex);
        } catch (RestClientException ex) {
            throw new PaymentGatewayException("No se pudo conectar con Mercado Pago.", ex);
        }
    }

    /** Consulta un pago en Mercado Pago. Es la fuente de verdad del estado de un pago. */
    public PaymentInfo getPayment(String paymentId) {
        ensureConfigured();
        try {
            return restClient.get()
                    .uri("/v1/payments/{id}", paymentId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.accessToken())
                    .retrieve()
                    .body(PaymentInfo.class);
        } catch (RestClientResponseException ex) {
            log.warn("Mercado Pago no devolvió el pago {} -> HTTP {}", paymentId, ex.getStatusCode().value());
            throw new PaymentGatewayException("No se pudo consultar el pago en Mercado Pago.", ex);
        } catch (RestClientException ex) {
            throw new PaymentGatewayException("No se pudo conectar con Mercado Pago.", ex);
        }
    }

    private void ensureConfigured() {
        if (!properties.isConfigured()) {
            throw new PaymentUnavailableException("La pasarela de pagos no está configurada en este entorno.");
        }
    }
}
