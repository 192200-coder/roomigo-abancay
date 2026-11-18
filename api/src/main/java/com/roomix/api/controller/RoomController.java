package com.roomix.api.controller;

import com.roomix.api.dto.common.ApiResponseDto;
import com.roomix.api.dto.common.PageResponseDto;
import com.roomix.api.dto.request.RoomFilterDto;
import com.roomix.api.dto.request.RoomRequestDto;
import com.roomix.api.dto.response.RoomResponseDto;
import com.roomix.api.service.RoomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
@Tag(name = "Habitaciones", description = "Búsqueda y gestión de habitaciones para alquiler")
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Crear habitación", description = "Publica una nueva habitación asociada a una propiedad.")
    public ResponseEntity<ApiResponseDto<RoomResponseDto>> createRoom(
            @Valid @RequestBody RoomRequestDto request,
            Authentication authentication) {
        RoomResponseDto response = roomService.createRoom(request, authentication.getName());
        return new ResponseEntity<>(ApiResponseDto.success("Habitación publicada exitosamente", response), HttpStatus.CREATED);
    }

    // Ruta literal: Spring la prioriza sobre /{id}. Antes no existía y el panel del propietario
    // recibía 400 ("my-rooms" no es un Long), mostrando "No se pudieron cargar tus habitaciones".
    @GetMapping("/my-rooms")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Habitaciones del propietario autenticado", description = "Incluye todos los estados (en revisión, disponibles, alquiladas...).")
    public ResponseEntity<ApiResponseDto<List<RoomResponseDto>>> getMyRooms(Authentication authentication) {
        return ResponseEntity.ok(ApiResponseDto.success("Habitaciones del propietario", roomService.getRoomsByOwner(authentication.getName())));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalle de habitación por ID")
    public ResponseEntity<ApiResponseDto<RoomResponseDto>> getRoomById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponseDto.success("Detalle de habitación", roomService.getRoomById(id)));
    }

    @GetMapping
    @Operation(summary = "Listar habitaciones disponibles con filtros y paginación")
    public ResponseEntity<ApiResponseDto<PageResponseDto<RoomResponseDto>>> getAllAvailableRooms(
            RoomFilterDto filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        return searchRooms(filter, page, size, sortBy, sortDir);
    }

    @GetMapping("/search")
    @Operation(summary = "Búsqueda filtrada y paginada de habitaciones disponibles")
    public ResponseEntity<ApiResponseDto<PageResponseDto<RoomResponseDto>>> searchRooms(
            RoomFilterDto filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        PageResponseDto<RoomResponseDto> result = roomService.searchRooms(filter, PageRequest.of(page, size, sort));

        return ResponseEntity.ok(ApiResponseDto.success("Resultados de búsqueda", result));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Cambiar estado de la habitación")
    public ResponseEntity<ApiResponseDto<RoomResponseDto>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            Authentication authentication) {
        RoomResponseDto response = roomService.updateRoomStatus(id, status, authentication.getName());
        return ResponseEntity.ok(ApiResponseDto.success("Estado actualizado", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Actualizar habitación", description = "Permite al propietario o administrador editar los datos de su habitación.")
    public ResponseEntity<ApiResponseDto<RoomResponseDto>> updateRoom(
            @PathVariable Long id,
            @RequestBody RoomRequestDto request) {
        RoomResponseDto response = roomService.updateRoom(id, request);
        return ResponseEntity.ok(ApiResponseDto.success("Habitación actualizada exitosamente", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Eliminar habitación", description = "Permite al propietario o administrador quitar una publicación de habitación.")
    public ResponseEntity<ApiResponseDto<Void>> deleteRoom(@PathVariable Long id) {
        roomService.deleteRoom(id);
        return ResponseEntity.ok(ApiResponseDto.success("Habitación eliminada exitosamente", null));
    }
}
