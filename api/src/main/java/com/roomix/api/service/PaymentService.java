package com.roomix.api.service;

import com.roomix.api.dto.response.CheckoutResponseDto;
import com.roomix.api.dto.response.PaymentStatusDto;

public interface PaymentService {

    /** Inicia el pago (primer mes + depósito) de una reserva aprobada. Solo el inquilino. */
    CheckoutResponseDto startBookingCheckout(Long reservationId, String tenantEmail);

    /** Inicia el pago de la tarifa de publicación de un cuarto. Solo su propietario. */
    CheckoutResponseDto startPublicationCheckout(Long roomId, String ownerEmail);

    /** Vuelta del comprador desde Checkout Pro: consulta el pago en Mercado Pago y lo concilia. */
    PaymentStatusDto confirmReturn(String providerPaymentId, String userEmail);

    /** Notificación (webhook) de Mercado Pago sobre un pago. */
    void handlePaymentNotification(String providerPaymentId);
}
