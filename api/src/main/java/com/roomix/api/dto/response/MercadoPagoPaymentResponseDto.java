package com.roomix.api.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MercadoPagoPaymentResponseDto {

    private String id;
    private String status;
    private String statusDetail;
    private String paymentMethod;
    private String paymentTypeId;
    private BigDecimal transactionAmount;
    private String currency;
    private LocalDateTime dateApproved;
    private String authorizationCode;
    private String cipCode;
    private String qrCode;
    private String receiptUrl;
    private String preferenceId;
    private String initPoint;
}
