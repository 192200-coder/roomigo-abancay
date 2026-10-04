package com.roomix.api.service;

import com.roomix.api.dto.request.BookingRequestDto;
import com.roomix.api.dto.response.BookingResponseDto;

import java.util.List;

public interface BookingService {
    BookingResponseDto createBooking(BookingRequestDto request, String tenantEmail);
    BookingResponseDto getBookingById(Long id, String userEmail);
    List<BookingResponseDto> getTenantBookings(String tenantEmail);
    List<BookingResponseDto> getOwnerBookings(String ownerEmail);
    BookingResponseDto updateBookingStatus(Long bookingId, String newStatus, String userEmail);
}