package com.roomix.api.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingRequestDto {

    @NotNull(message = "El ID de la habitación es obligatorio")
    private Long roomId;

    @NotNull(message = "La fecha de inicio es obligatoria")
    @Future(message = "La fecha de inicio debe ser una fecha futura")
    private LocalDate startDate;

    @NotNull(message = "La fecha de fin es obligatoria")
    @Future(message = "La fecha de fin debe ser una fecha futura")
    private LocalDate endDate;

    private String notes;
}
