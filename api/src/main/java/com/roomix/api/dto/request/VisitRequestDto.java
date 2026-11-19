package com.roomix.api.dto.request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

/** Pedido de visita a una publicación en venta. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisitRequestDto {

    @NotNull(message = "Indica la publicación")
    private Long roomId;

    @NotNull(message = "Elige una fecha para la visita")
    @FutureOrPresent(message = "La fecha de la visita no puede estar en el pasado")
    private LocalDate preferredDate;

    /** Hora sugerida (opcional). */
    private LocalTime preferredTime;

    @Pattern(regexp = "^$|^\\+?[0-9 ]{6,20}$", message = "El teléfono solo puede tener números y espacios")
    private String contactPhone;

    @Size(max = 1000, message = "El mensaje admite como máximo 1000 caracteres")
    private String message;
}
