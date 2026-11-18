package com.roomix.api.exception;

/**
 * Error al comunicarse con la pasarela de pagos (Mercado Pago no respondió o rechazó la solicitud).
 * Se responde 502 Bad Gateway; el detalle técnico solo se registra en el log.
 */
public class PaymentGatewayException extends RuntimeException {
    public PaymentGatewayException(String message, Throwable cause) {
        super(message, cause);
    }
}
