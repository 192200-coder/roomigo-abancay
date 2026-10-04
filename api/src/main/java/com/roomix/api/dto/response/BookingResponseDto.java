package com.roomix.api.dto.response;

import com.roomix.api.entity.enums.ReservationStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponseDto {

    private Long id;
    private RoomResponseDto room;
    private UserResponseDto tenant;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal totalPrice;
    private ReservationStatus status;
    private String notes;
    private LocalDateTime createdAt;
}
