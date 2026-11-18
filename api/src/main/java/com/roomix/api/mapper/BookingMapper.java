package com.roomix.api.mapper;

import com.roomix.api.dto.response.BookingResponseDto;
import com.roomix.api.entity.Reservation;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BookingMapper {

    private final RoomMapper roomMapper;
    private final UserMapper userMapper;

    public BookingResponseDto toDto(Reservation reservation) {
        if (reservation == null) return null;

        return BookingResponseDto.builder()
                .id(reservation.getId())
                .room(roomMapper.toDto(reservation.getRoom()))
                .tenant(userMapper.toDto(reservation.getTenant()))
                .startDate(reservation.getStartDate())
                .endDate(reservation.getEndDate())
                .months(reservation.getMonths())
                .totalPrice(reservation.getTotalPrice())
                .status(reservation.getStatus())
                .notes(reservation.getNotes())
                .createdAt(reservation.getCreatedAt())
                .build();
    }
}