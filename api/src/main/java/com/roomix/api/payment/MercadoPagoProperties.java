package com.roomix.api.payment;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuración de Mercado Pago (Checkout Pro). Se completa desde variables de entorno
 * (ver application.properties y api/.env.example).
 *
 * @param accessToken         token privado de la cuenta vendedora (MP_ACCESS_TOKEN)
 * @param webhookSecret       clave para validar la firma x-signature de los webhooks (MP_WEBHOOK_SECRET)
 * @param backUrlBase         URL pública del frontend a la que vuelve el comprador (MP_BACK_URL_BASE)
 * @param webhookUrl          URL pública del webhook del backend (MP_WEBHOOK_URL)
 * @param apiBaseUrl          URL de la API de Mercado Pago
 * @param statementDescriptor texto que aparece en el resumen de la tarjeta
 */
@ConfigurationProperties(prefix = "app.mercadopago")
public record MercadoPagoProperties(
        String accessToken,
        String webhookSecret,
        String backUrlBase,
        String webhookUrl,
        String apiBaseUrl,
        String statementDescriptor
) {

    public boolean isConfigured() {
        return hasText(accessToken);
    }

    public boolean hasWebhookSecret() {
        return hasText(webhookSecret);
    }

    /** Mercado Pago solo acepta auto_return y notification_url con URLs HTTPS públicas. */
    public boolean isHttps(String url) {
        return hasText(url) && url.startsWith("https://");
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
