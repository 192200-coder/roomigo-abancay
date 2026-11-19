package com.roomix.api.dto.response;

import com.roomix.api.entity.enums.VisitRequestStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisitRequestResponseDto {

    private Long id;
    private Long roomId;
    private String roomTitle;
    private String roomAddress;
    private String roomMainImageUrl;
    private BigDecimal salePrice;

    private String requesterName;
    private String requesterEmail;
    /** Teléfono que dejó el interesado, o el de su cuenta. */
    private String contactPhone;

    private String ownerName;
    /** Solo se comparte con el interesado cuando el propietario confirma la visita. */
    private String ownerPhone;

    private LocalDate preferredDate;
    private LocalTime preferredTime;
    private String message;
    private VisitRequestStatus status;
    private String ownerNote;
    private LocalDateTime createdAt;
}
