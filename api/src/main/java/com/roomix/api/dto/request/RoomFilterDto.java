package com.roomix.api.dto.request;

import com.roomix.api.entity.enums.ListingOperation;
import com.roomix.api.entity.enums.RoomType;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomFilterDto {

    private String city;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    /** Alquiler o venta. Sin valor se muestran ambas. */
    private ListingOperation operation;
    private RoomType roomType;
    /** Mínimo de dormitorios. */
    private Integer minBedrooms;
    private Boolean privateBathroom;
    private Boolean offersWifi;
    private Boolean acceptsPets;
    private Double minRating;
}
