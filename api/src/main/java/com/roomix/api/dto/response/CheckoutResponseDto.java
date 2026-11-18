package com.roomix.api.dto.response;

import com.roomix.api.entity.enums.PaymentPurpose;
import lombok.*;

import java.math.BigDecimal;

/** Datos para redirigir al comprador al Checkout Pro de Mercado Pago. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutResponseDto {
    private Long paymentId;
    private PaymentPurpose purpose;
    private String preferenceId;
    /** URL de Checkout Pro a la que el frontend redirige al usuario. */
    private String checkoutUrl;
    private BigDecimal amount;
    private String currency;
}
