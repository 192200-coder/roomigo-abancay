package com.roomix.api.controller;

import com.roomix.api.dto.common.ApiResponseDto;
import com.roomix.api.dto.request.BookingRequestDto;
import com.roomix.api.dto.response.BookingResponseDto;
import com.roomix.api.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
@Tag(name = "Reservas", description = "Gestión del proceso de alquiler y solicitudes de reserva")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @PreAuthorize("hasAnyRole('TENANT', 'ADMIN')")
    @Operation(summary = "Solicitar reserva", description = "Permite a un inquilino enviar una solicitud de alquiler.")
    public ResponseEntity<ApiResponseDto<BookingResponseDto>> createBooking(
            @Valid @RequestBody BookingRequestDto request,
            Authentication authentication) {
        BookingResponseDto response = bookingService.createBooking(request, authentication.getName());
        return new ResponseEntity<>(ApiResponseDto.success("Solicitud de reserva enviada", response), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener detalle de reserva")
    public ResponseEntity<ApiResponseDto<BookingResponseDto>> getBookingById(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponseDto.success("Detalle de reserva", bookingService.getBookingById(id, authentication.getName())));
    }

    @GetMapping("/my-bookings")
    @PreAuthorize("hasAnyRole('TENANT', 'ADMIN')")
    @Operation(summary = "Listar mis reservas (Inquilino)")
    public ResponseEntity<ApiResponseDto<List<BookingResponseDto>>> getTenantBookings(Authentication authentication) {
        List<BookingResponseDto> list = bookingService.getTenantBookings(authentication.getName());
        return ResponseEntity.ok(ApiResponseDto.success("Reservas del inquilino", list));
    }

    @GetMapping("/owner-requests")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Listar solicitudes recibidas (Propietario)")
    public ResponseEntity<ApiResponseDto<List<BookingResponseDto>>> getOwnerBookings(Authentication authentication) {
        List<BookingResponseDto> list = bookingService.getOwnerBookings(authentication.getName());
        return ResponseEntity.ok(ApiResponseDto.success("Solicitudes de alquiler recibidas", list));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Aprobar o rechazar reserva")
    public ResponseEntity<ApiResponseDto<BookingResponseDto>> updateBookingStatus(
            @PathVariable Long id,
            @RequestParam String status,
            Authentication authentication) {
        BookingResponseDto response = bookingService.updateBookingStatus(id, status, authentication.getName());
        return ResponseEntity.ok(ApiResponseDto.success("Estado de reserva actualizado", response));
    }
}