package com.roomix.api.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingRequestDto {

    public static final int MIN_MONTHS = 1;
    public static final int MAX_MONTHS = 12;

    @NotNull(message = "El ID de la habitación es obligatorio")
    private Long roomId;

    @NotNull(message = "La fecha de inicio es obligatoria")
    @Future(message = "La fecha de inicio debe ser una fecha futura")
    private LocalDate startDate;

    /** Duración del alquiler en meses. La fecha de fin se calcula como startDate + months. */
    @NotNull(message = "El número de meses es obligatorio")
    @Min(value = MIN_MONTHS, message = "El alquiler mínimo es de 1 mes")
    @Max(value = MAX_MONTHS, message = "El alquiler máximo es de 12 meses")
    private Integer months;

    private String notes;
}
