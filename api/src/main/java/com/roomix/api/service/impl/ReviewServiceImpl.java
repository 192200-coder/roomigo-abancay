package com.roomix.api.service.impl;

import com.roomix.api.dto.request.ReviewRequestDto;
import com.roomix.api.dto.response.ReviewResponseDto;
import com.roomix.api.entity.Reservation;
import com.roomix.api.entity.Review;
import com.roomix.api.entity.Room;
import com.roomix.api.entity.enums.ReservationStatus;
import com.roomix.api.exception.BadRequestException;
import com.roomix.api.exception.ConflictException;
import com.roomix.api.exception.ResourceNotFoundException;
import com.roomix.api.exception.UnauthorizedException;
import com.roomix.api.mapper.ReviewMapper;
import com.roomix.api.repository.ReservationRepository;
import com.roomix.api.repository.ReviewRepository;
import com.roomix.api.repository.RoomRepository;
import com.roomix.api.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final ReviewMapper reviewMapper;

    @Override
    @Transactional
    public ReviewResponseDto createReview(ReviewRequestDto request, String tenantEmail) {
        Reservation reservation = reservationRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada"));

        if (!reservation.getTenant().getEmail().equals(tenantEmail)) {
            throw new UnauthorizedException("Solo el inquilino de la reserva puede emitir una reseña");
        }

        if (reservation.getStatus() != ReservationStatus.COMPLETED && reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new BadRequestException("Solo se pueden calificar reservas confirmadas o completadas");
        }

        if (reviewRepository.existsByReservationId(reservation.getId())) {
            throw new ConflictException("Ya existe una reseña registrada para esta reserva");
        }

        Room room = reservation.getRoom();

        Review review = Review.builder()
                .room(room)
                .user(reservation.getTenant())
                .reservation(reservation)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review savedReview = reviewRepository.save(review);

        // Recalcular promedio de puntuación
        Double avgRating = reviewRepository.getAverageRatingByRoomId(room.getId());
        room.setAverageRating(avgRating != null ? avgRating : (double) request.getRating());
        room.setTotalReviews((room.getTotalReviews() != null ? room.getTotalReviews() : 0) + 1);
        roomRepository.save(room);

        return reviewMapper.toDto(savedReview);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponseDto> getReviewsByRoom(Long roomId) {
        return reviewRepository.findByRoomId(roomId).stream()
                .map(reviewMapper::toDto)
                .collect(Collectors.toList());
    }
}