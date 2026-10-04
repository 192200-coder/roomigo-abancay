package com.roomix.api.dto.request;

import com.roomix.api.entity.enums.RoomType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomRequestDto {

    @NotNull(message = "El ID de la propiedad es obligatorio")
    private Long propertyId;

    @NotNull(message = "El título es obligatorio")
    private String title;

    private String description;

    @NotNull(message = "El precio mensual es obligatorio")
    @Positive(message = "El precio debe ser un valor positivo")
    private BigDecimal pricePerMonth;

    @NotNull(message = "El depósito de garantía es obligatorio")
    private BigDecimal depositPrice;

    @NotNull(message = "El tipo de habitación es obligatorio")
    private RoomType roomType;

    private boolean privateBathroom;

    @Min(value = 1, message = "La capacidad mínima es 1 persona")
    @Builder.Default
    private Integer capacity = 1;

    private Double sizeSqm;
    private boolean offersWifi;
    private boolean acceptsPets;
    private String mainImageUrl;
    private java.util.List<String> imageUrls;

    private String paymentMethod;
    private String paymentReference;
    private String status;
}
