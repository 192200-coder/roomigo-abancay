package com.roomix.api.controller;

import com.roomix.api.dto.common.ApiResponseDto;
import com.roomix.api.dto.request.VisitRequestDto;
import com.roomix.api.dto.request.VisitStatusUpdateDto;
import com.roomix.api.dto.response.VisitRequestResponseDto;
import com.roomix.api.service.VisitRequestService;
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
@RequestMapping("/api/v1/visit-requests")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Visitas", description = "Pedidos de visita a publicaciones en venta")
public class VisitRequestController {

    private final VisitRequestService visitRequestService;

    @PostMapping
    @Operation(summary = "Agendar visita", description = "El interesado propone una fecha para visitar una publicación en venta.")
    public ResponseEntity<ApiResponseDto<VisitRequestResponseDto>> create(
            @Valid @RequestBody VisitRequestDto request,
            Authentication authentication) {
        VisitRequestResponseDto response = visitRequestService.create(request, authentication.getName());
        return new ResponseEntity<>(ApiResponseDto.success("Pedido de visita enviado al propietario", response), HttpStatus.CREATED);
    }

    @GetMapping("/mine")
    @Operation(summary = "Mis pedidos de visita")
    public ResponseEntity<ApiResponseDto<List<VisitRequestResponseDto>>> mine(Authentication authentication) {
        return ResponseEntity.ok(ApiResponseDto.success("Pedidos de visita", visitRequestService.getMine(authentication.getName())));
    }

    @GetMapping("/owner")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Pedidos de visita recibidos (Propietario)")
    public ResponseEntity<ApiResponseDto<List<VisitRequestResponseDto>>> forOwner(Authentication authentication) {
        return ResponseEntity.ok(ApiResponseDto.success("Pedidos de visita recibidos", visitRequestService.getForOwner(authentication.getName())));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Responder o cancelar un pedido de visita",
            description = "El propietario confirma (CONFIRMED) o declina (DECLINED); el interesado puede cancelar (CANCELLED).")
    public ResponseEntity<ApiResponseDto<VisitRequestResponseDto>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody VisitStatusUpdateDto update,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponseDto.success("Pedido de visita actualizado",
                visitRequestService.updateStatus(id, update, authentication.getName())));
    }
}
