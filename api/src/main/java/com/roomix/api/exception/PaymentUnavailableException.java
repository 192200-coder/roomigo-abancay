package com.roomix.api.exception;

/** La pasarela de pagos no está configurada en este entorno (falta MP_ACCESS_TOKEN). Responde 503. */
public class PaymentUnavailableException extends RuntimeException {
    public PaymentUnavailableException(String message) {
        super(message);
    }
}
