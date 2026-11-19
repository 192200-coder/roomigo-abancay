package com.roomix.api.dto.response;

import com.roomix.api.dto.common.RoomPhotoDto;
import com.roomix.api.entity.enums.ListingOperation;
import com.roomix.api.entity.enums.RoomStatus;
import com.roomix.api.entity.enums.RoomType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomResponseDto {

    private Long id;
    private Long propertyId;
    private String propertyCity;
    private String propertyAddress;
    private String title;
    private String description;
    private ListingOperation operation;
    private BigDecimal pricePerMonth;
    private BigDecimal depositPrice;
    private BigDecimal salePrice;
    private RoomType roomType;
    private RoomStatus status;
    private boolean privateBathroom;
    private Integer capacity;
    private Double sizeSqm;
    private Double landAreaSqm;
    private Integer bedrooms;
    private Integer bathrooms;
    private boolean offersWifi;
    private boolean acceptsPets;
    private String mainImageUrl;
    /** Galería completa. Solo se incluye en el detalle (las fotos pesan demasiado para los listados). */
    private List<RoomPhotoDto> photos;
    private Double averageRating;
    private Integer totalReviews;
    private boolean publicationFeePaid;
    private String paymentMethod;
    private String paymentReference;
    private BigDecimal publicationFeeAmount;
    private String ownerName;
    private String ownerEmail;
    private String ownerPhone;
    private LocalDateTime createdAt;
}