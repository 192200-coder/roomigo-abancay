package com.roomix.api.dto.request;

import com.roomix.api.dto.common.RoomPhotoDto;
import com.roomix.api.entity.enums.ListingOperation;
import com.roomix.api.entity.enums.RoomType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Datos de una publicación. Las reglas que dependen de la operación (alquiler: renta y
 * depósito; venta: precio de venta) y las fotos obligatorias se validan en
 * {@code RoomServiceImpl}, porque dependen de varios campos a la vez.
 */
@Getter
@Setter
@NoArgsConstructor
// Constructor privado (solo para @Builder): así Jackson usa el vacío + setters y acepta
// JSON parciales (p. ej. un PUT solo con el título) sin fallar por booleanos ausentes.
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class RoomRequestDto {

    @NotNull(message = "El ID de la propiedad es obligatorio")
    private Long propertyId;

    @NotNull(message = "El título es obligatorio")
    private String title;

    private String description;

    /** Alquiler (por defecto) o venta. */
    @Builder.Default
    private ListingOperation operation = ListingOperation.RENT;

    @Positive(message = "El precio mensual debe ser un valor positivo")
    private BigDecimal pricePerMonth;

    @PositiveOrZero(message = "El depósito no puede ser negativo")
    private BigDecimal depositPrice;

    @Positive(message = "El precio de venta debe ser un valor positivo")
    private BigDecimal salePrice;

    @NotNull(message = "El tipo de inmueble es obligatorio")
    private RoomType roomType;

    private boolean privateBathroom;

    @Min(value = 1, message = "La capacidad mínima es 1 persona")
    @Builder.Default
    private Integer capacity = 1;

    /** Área construida (o del cuarto) en m². */
    @Positive(message = "El área debe ser un valor positivo")
    private Double sizeSqm;

    @Positive(message = "El área del terreno debe ser un valor positivo")
    private Double landAreaSqm;

    @PositiveOrZero(message = "Los dormitorios no pueden ser negativos")
    private Integer bedrooms;

    @PositiveOrZero(message = "Los baños no pueden ser negativos")
    private Integer bathrooms;

    private boolean offersWifi;
    private boolean acceptsPets;
    private String mainImageUrl;

    /**
     * Fotos con su categoría. Al crear es obligatorio; al editar, {@code null} conserva las
     * fotos actuales y una lista las reemplaza todas.
     */
    @Valid
    private List<RoomPhotoDto> photos;

    private String paymentMethod;
    private String paymentReference;
    private String status;
}
