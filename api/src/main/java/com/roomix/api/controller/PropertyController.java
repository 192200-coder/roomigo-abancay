package com.roomix.api.controller;

import com.roomix.api.dto.common.ApiResponseDto;
import com.roomix.api.dto.request.PropertyRequestDto;
import com.roomix.api.dto.response.PropertyResponseDto;
import com.roomix.api.service.PropertyService;
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
@RequestMapping("/api/v1/properties")
@RequiredArgsConstructor
@Tag(name = "Propiedades", description = "Gestión de inmuebles registrados por propietarios")
public class PropertyController {

    private final PropertyService propertyService;

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Crear propiedad", description = "Permite a un propietario registrar un inmueble.")
    public ResponseEntity<ApiResponseDto<PropertyResponseDto>> createProperty(
            @Valid @RequestBody PropertyRequestDto request,
            Authentication authentication) {
        PropertyResponseDto response = propertyService.createProperty(request, authentication.getName());
        return new ResponseEntity<>(ApiResponseDto.success("Propiedad creada exitosamente", response), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener propiedad por ID")
    public ResponseEntity<ApiResponseDto<PropertyResponseDto>> getPropertyById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponseDto.success("Propiedad obtenida", propertyService.getPropertyById(id)));
    }

    @GetMapping("/my-properties")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Listar mis propiedades", description = "Obtiene las propiedades pertenecientes al propietario autenticado.")
    public ResponseEntity<ApiResponseDto<List<PropertyResponseDto>>> getMyProperties(Authentication authentication) {
        List<PropertyResponseDto> list = propertyService.getPropertiesByOwner(authentication.getName());
        return ResponseEntity.ok(ApiResponseDto.success("Listado de propiedades", list));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Eliminar propiedad")
    public ResponseEntity<ApiResponseDto<Void>> deleteProperty(@PathVariable Long id, Authentication authentication) {
        propertyService.deleteProperty(id, authentication.getName());
        return ResponseEntity.ok(ApiResponseDto.success("Propiedad eliminada exitosamente"));
    }
}