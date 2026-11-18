package com.roomix.api.payment;

import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Locale;

/**
 * Valida la firma de los webhooks de Mercado Pago.
 *
 * <p>Cabecera {@code x-signature: ts=<timestamp>,v1=<hmac>}. El HMAC-SHA256 (hex) se calcula con
 * la clave secreta del webhook sobre el manifiesto {@code id:<data.id>;request-id:<x-request-id>;ts:<ts>;}
 * (las partes ausentes se omiten). Si data.id es alfanumérico se usa en minúsculas.
 */
@Component
public class WebhookSignatureValidator {

    public enum Result { VALID, INVALID, MISSING }

    private final MercadoPagoProperties properties;

    public WebhookSignatureValidator(MercadoPagoProperties properties) {
        this.properties = properties;
    }

    public Result validate(String signatureHeader, String requestId, String dataId) {
        if (signatureHeader == null || signatureHeader.isBlank()) {
            return Result.MISSING;
        }
        if (!properties.hasWebhookSecret()) {
            return Result.MISSING;
        }

        String ts = null;
        String v1 = null;
        for (String part : signatureHeader.split(",")) {
            String[] kv = part.trim().split("=", 2);
            if (kv.length != 2) continue;
            if ("ts".equals(kv[0].trim())) ts = kv[1].trim();
            if ("v1".equals(kv[0].trim())) v1 = kv[1].trim();
        }
        if (ts == null || v1 == null) {
            return Result.INVALID;
        }

        String expected = sign(manifest(dataId, requestId, ts));
        boolean matches = MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.US_ASCII),
                v1.toLowerCase(Locale.ROOT).getBytes(StandardCharsets.US_ASCII));
        return matches ? Result.VALID : Result.INVALID;
    }

    /** Construye el manifiesto firmado por Mercado Pago. Público para poder generar firmas en tests. */
    public static String manifest(String dataId, String requestId, String ts) {
        StringBuilder sb = new StringBuilder();
        if (dataId != null && !dataId.isBlank()) {
            String id = dataId.matches("[A-Za-z0-9]+") ? dataId.toLowerCase(Locale.ROOT) : dataId;
            sb.append("id:").append(id).append(';');
        }
        if (requestId != null && !requestId.isBlank()) {
            sb.append("request-id:").append(requestId).append(';');
        }
        if (ts != null && !ts.isBlank()) {
            sb.append("ts:").append(ts).append(';');
        }
        return sb.toString();
    }

    String sign(String manifest) {
        return hmacSha256Hex(properties.webhookSecret(), manifest);
    }

    public static String hmacSha256Hex(String secret, String message) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(message.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HmacSHA256 no disponible", e);
        }
    }
}
