package com.roomix.api.controller;

import com.roomix.api.dto.common.ApiResponseDto;
import com.roomix.api.dto.common.PageResponseDto;
import com.roomix.api.dto.response.NotificationDto;
import com.roomix.api.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Notificaciones del usuario autenticado (cada usuario solo ve y modifica las suyas). */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notificaciones", description = "Avisos de reservas, pagos y publicaciones")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Listar mis notificaciones (más recientes primero)")
    public ResponseEntity<ApiResponseDto<PageResponseDto<NotificationDto>>> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponseDto.success("Notificaciones",
                notificationService.getMyNotifications(authentication.getName(), page, size)));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Cantidad de notificaciones sin leer")
    public ResponseEntity<ApiResponseDto<Map<String, Long>>> countUnread(Authentication authentication) {
        return ResponseEntity.ok(ApiResponseDto.success("Notificaciones sin leer",
                Map.of("count", notificationService.countUnread(authentication.getName()))));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Marcar una notificación como leída")
    public ResponseEntity<ApiResponseDto<NotificationDto>> markAsRead(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(ApiResponseDto.success("Notificación leída",
                notificationService.markAsRead(id, authentication.getName())));
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Marcar todas mis notificaciones como leídas")
    public ResponseEntity<ApiResponseDto<Map<String, Integer>>> markAllAsRead(Authentication authentication) {
        return ResponseEntity.ok(ApiResponseDto.success("Notificaciones leídas",
                Map.of("updated", notificationService.markAllAsRead(authentication.getName()))));
    }
}
