package com.roomix.api.dto.request;

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
    private RoomType roomType;
    private Boolean privateBathroom;
    private Boolean offersWifi;
    private Boolean acceptsPets;
    private Double minRating;
}
