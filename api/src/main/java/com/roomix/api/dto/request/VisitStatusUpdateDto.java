package com.roomix.api.dto.request;

import com.roomix.api.entity.enums.VisitRequestStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

/** Respuesta a un pedido de visita: el propietario confirma o declina; el interesado puede cancelar. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisitStatusUpdateDto {

    @NotNull(message = "Indica el nuevo estado")
    private VisitRequestStatus status;

    @Size(max = 300, message = "La nota admite como máximo 300 caracteres")
    private String note;
}
