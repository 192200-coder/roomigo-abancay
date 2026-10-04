package com.roomix.api.controller;

import com.roomix.api.dto.common.ApiResponseDto;
import com.roomix.api.dto.request.ReviewRequestDto;
import com.roomix.api.dto.response.ReviewResponseDto;
import com.roomix.api.service.ReviewService;
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
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
@Tag(name = "Reseñas", description = "Calificaciones y opiniones sobre las habitaciones")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @PreAuthorize("hasAnyRole('TENANT', 'ADMIN')")
    @Operation(summary = "Crear reseña", description = "Permite a un inquilino calificar su estadía.")
    public ResponseEntity<ApiResponseDto<ReviewResponseDto>> createReview(
            @Valid @RequestBody ReviewRequestDto request,
            Authentication authentication) {
        ReviewResponseDto response = reviewService.createReview(request, authentication.getName());
        return new ResponseEntity<>(ApiResponseDto.success("Reseña publicada exitosamente", response), HttpStatus.CREATED);
    }

    @GetMapping("/room/{roomId}")
    @Operation(summary = "Obtener reseñas de una habitación")
    public ResponseEntity<ApiResponseDto<List<ReviewResponseDto>>> getReviewsByRoom(@PathVariable Long roomId) {
        List<ReviewResponseDto> list = reviewService.getReviewsByRoom(roomId);
        return ResponseEntity.ok(ApiResponseDto.success("Reseñas encontradas", list));
    }
}
