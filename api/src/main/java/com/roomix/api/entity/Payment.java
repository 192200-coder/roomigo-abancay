package com.roomix.api.entity;

import com.roomix.api.entity.enums.PaymentPurpose;
import com.roomix.api.entity.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Pago procesado por Mercado Pago. Puede corresponder a una reserva (primer mes + depósito)
 * o a la tarifa de publicación de un cuarto. Hay un registro por concepto: los reintentos
 * del usuario actualizan el mismo registro con el último pago informado por Mercado Pago.
 */
@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentPurpose purpose;

    /** Reserva pagada (purpose = BOOKING). */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", unique = true)
    private Reservation reservation;

    /** Cuarto cuya publicación se paga (purpose = ROOM_PUBLICATION). */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", unique = true)
    private Room room;

    /** Referencia propia enviada a Mercado Pago (p. ej. BOOKING-12). */
    @Column(name = "external_reference", nullable = false, unique = true, length = 80)
    private String externalReference;

    /** Última preferencia de Checkout Pro creada para este pago. */
    @Column(name = "preference_id", length = 120)
    private String preferenceId;

    /** Id del pago en Mercado Pago (el último intento informado). */
    @Column(name = "provider_payment_id", unique = true, length = 40)
    private String providerPaymentId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(length = 3, nullable = false)
    @Builder.Default
    private String currency = "PEN";

    /** Medio usado (visa, yape, pagoefectivo_atm...) o MERCADO_PAGO mientras no se paga. */
    @Column(name = "payment_method", nullable = false, length = 40)
    private String paymentMethod;

    /** Campo heredado de la versión simulada; ya no se usa. */
    @Column(name = "transaction_code", length = 100)
    private String transactionCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    /** Detalle devuelto por Mercado Pago (accredited, cc_rejected_insufficient_amount...). */
    @Column(name = "status_detail", length = 80)
    private String statusDetail;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
