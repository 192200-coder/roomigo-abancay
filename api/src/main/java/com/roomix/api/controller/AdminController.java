package com.roomix.api.controller;

import com.roomix.api.dto.common.ApiResponseDto;
import com.roomix.api.dto.request.RoomRequestDto;
import com.roomix.api.dto.response.RoomResponseDto;
import com.roomix.api.entity.enums.ReservationStatus;
import com.roomix.api.entity.enums.RoomStatus;
import com.roomix.api.repository.PropertyRepository;
import com.roomix.api.repository.ReservationRepository;
import com.roomix.api.repository.RoomRepository;
import com.roomix.api.repository.UserRepository;
import com.roomix.api.service.RoomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Administrador General", description = "Endpoints de control y aprobación para la plataforma Roomix Abancay")
public class AdminController {

    private final RoomService roomService;
    private final RoomRepository roomRepository;
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;

    @GetMapping("/rooms/pending")
    @Operation(summary = "Obtener anuncios de habitaciones pendientes de aprobación")
    public ResponseEntity<ApiResponseDto<List<RoomResponseDto>>> getPendingRooms() {
        List<RoomResponseDto> list = roomService.getPendingRooms();
        return ResponseEntity.ok(ApiResponseDto.success("Habitaciones pendientes de aprobación", list));
    }

    @GetMapping("/rooms")
    @Operation(summary = "Obtener todas las habitaciones (para gestión de administrador)")
    public ResponseEntity<ApiResponseDto<List<RoomResponseDto>>> getAllRooms() {
        List<RoomResponseDto> list = roomService.getAllRoomsForAdmin();
        return ResponseEntity.ok(ApiResponseDto.success("Listado de todas las habitaciones", list));
    }

    @PatchMapping("/rooms/{id}/approve")
    @Operation(summary = "Aprobar anuncio de habitación y habilitarlo al público")
    public ResponseEntity<ApiResponseDto<RoomResponseDto>> approveRoom(
            @PathVariable Long id,
            Authentication authentication) {
        RoomResponseDto response = roomService.approveRoom(id, authentication.getName());
        return ResponseEntity.ok(ApiResponseDto.success("Anuncio de habitación aprobado con éxito y publicado en Abancay", response));
    }

    @PatchMapping("/rooms/{id}/reject")
    @Operation(summary = "Rechazar anuncio de habitación")
    public ResponseEntity<ApiResponseDto<RoomResponseDto>> rejectRoom(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "No cumple los requisitos de publicación o comprobante no verificado") String reason,
            Authentication authentication) {
        RoomResponseDto response = roomService.rejectRoom(id, authentication.getName(), reason);
        return ResponseEntity.ok(ApiResponseDto.success("Anuncio de habitación rechazado", response));
    }

    @PatchMapping("/rooms/{id}/location")
    @Operation(summary = "Actualizar manualmente la ubicación de una habitación (Administrador)")
    public ResponseEntity<ApiResponseDto<RoomResponseDto>> updateRoomLocation(
            @PathVariable Long id,
            @RequestBody Map<String, String> locationData) {
        RoomResponseDto response = roomService.updateRoomLocation(id, locationData);
        return ResponseEntity.ok(ApiResponseDto.success("Ubicación de la habitación actualizada manualmente con éxito", response));
    }

    @GetMapping("/stats")
    @Operation(summary = "Métricas y estadísticas de la plataforma Roomix Abancay")
    public ResponseEntity<ApiResponseDto<Map<String, Object>>> getAdminStats() {
        long totalRooms = roomRepository.count();
        long pendingRooms = roomRepository.countByStatus(RoomStatus.PENDING_APPROVAL);
        long availableRooms = roomRepository.countByStatus(RoomStatus.AVAILABLE);
        long totalUsers = userRepository.count();
        long totalProperties = propertyRepository.count();
        long totalReservations = reservationRepository.count();
        
        // Fee de S/. 15 por anuncio publicado/aprobado
        BigDecimal totalFees = BigDecimal.valueOf(availableRooms).multiply(new BigDecimal("15.00"));

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRooms", totalRooms);
        stats.put("pendingRooms", pendingRooms);
        stats.put("availableRooms", availableRooms);
        stats.put("totalUsers", totalUsers);
        stats.put("totalProperties", totalProperties);
        stats.put("totalReservations", totalReservations);
        stats.put("totalFeesCollected", totalFees);
        stats.put("city", "Abancay, Apurímac");

        return ResponseEntity.ok(ApiResponseDto.success("Estadísticas de la plataforma obtenidas", stats));
    }

    @PutMapping("/rooms/{id}")
    @Operation(summary = "Actualizar anuncio de habitación (Administrador)")
    public ResponseEntity<ApiResponseDto<RoomResponseDto>> updateRoom(
            @PathVariable Long id,
            @RequestBody RoomRequestDto request) {
        RoomResponseDto response = roomService.updateRoom(id, request);
        return ResponseEntity.ok(ApiResponseDto.success("Anuncio de habitación actualizado con éxito", response));
    }

    @DeleteMapping("/rooms/{id}")
    @Operation(summary = "Eliminar anuncio de habitación permanentemente (Administrador)")
    public ResponseEntity<ApiResponseDto<Void>> deleteRoom(@PathVariable Long id) {
        roomService.deleteRoom(id);
        return ResponseEntity.ok(ApiResponseDto.success("Anuncio eliminado exitosamente de la plataforma", null));
    }
}
