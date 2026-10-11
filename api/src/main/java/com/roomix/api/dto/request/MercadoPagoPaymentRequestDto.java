package com.roomix.api.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MercadoPagoPaymentRequestDto {

    @NotBlank(message = "El título o concepto es obligatorio")
    private String title;

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.10", message = "El monto mínimo a procesar es 0.10 PEN")
    private BigDecimal amount;

    @Builder.Default
    private String currency = "PEN";

    @NotBlank(message = "El método de pago de Mercado Pago es obligatorio (CREDIT_CARD, DEBIT_CARD, YAPE, PAGO_EFECTIVO, WALLET)")
    private String subMethod;

    private String payerEmail;
    private String payerName;
    private String payerDni;

    // Datos de Tarjeta si aplica
    private String cardNumber;
    private String cardHolder;
    private String cardExpMonth;
    private String cardExpYear;
    private String cardCvv;
    private Integer installments;

    // Yape OTP si aplica
    private String yapeOtp;

    private String notes;

    // Relación con Reserva o Publicación de Habitación
    private String entityType; // BOOKING o ROOM_PUBLICATION
    private Long entityId;
}
