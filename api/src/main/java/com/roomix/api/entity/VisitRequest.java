package com.roomix.api.entity;

import com.roomix.api.entity.enums.VisitRequestStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Pedido de visita a una publicación en VENTA. Reemplaza a la reserva: en venta no se
 * reserva ni se paga por la plataforma; el interesado propone una fecha y el propietario
 * la confirma o la declina.
 */
@Entity
@Table(name = "visit_requests", indexes = {
        @Index(name = "idx_visit_requests_room", columnList = "room_id"),
        @Index(name = "idx_visit_requests_requester", columnList = "requester_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisitRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @Column(name = "preferred_date", nullable = false)
    private LocalDate preferredDate;

    @Column(name = "preferred_time")
    private LocalTime preferredTime;

    /** Teléfono de contacto del interesado (puede diferir del de su cuenta). */
    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private VisitRequestStatus status = VisitRequestStatus.PENDING;

    /** Respuesta opcional del propietario al confirmar o declinar. */
    @Column(name = "owner_note", length = 300)
    private String ownerNote;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
