package com.roomix.api.service.impl;

import com.roomix.api.dto.request.BookingRequestDto;
import com.roomix.api.dto.response.BookingResponseDto;
import com.roomix.api.entity.Reservation;
import com.roomix.api.entity.Room;
import com.roomix.api.entity.User;
import com.roomix.api.entity.enums.ReservationStatus;
import com.roomix.api.entity.enums.RoomStatus;
import com.roomix.api.exception.BadRequestException;
import com.roomix.api.exception.ConflictException;
import com.roomix.api.exception.ResourceNotFoundException;
import com.roomix.api.exception.UnauthorizedException;
import com.roomix.api.mapper.BookingMapper;
import com.roomix.api.repository.ReservationRepository;
import com.roomix.api.repository.RoomRepository;
import com.roomix.api.repository.UserRepository;
import com.roomix.api.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final BookingMapper bookingMapper;

    @Override
    @Transactional
    public BookingResponseDto createBooking(BookingRequestDto request, String tenantEmail) {
        if (!request.getEndDate().isAfter(request.getStartDate())) {
            throw new BadRequestException("La fecha de fin debe ser posterior a la fecha de inicio");
        }

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Habitación no encontrada"));

        if (room.getStatus() != RoomStatus.AVAILABLE) {
            throw new BadRequestException("La habitación no se encuentra disponible para reserva");
        }

        if (reservationRepository.existsOverlappingReservation(room.getId(), request.getStartDate(), request.getEndDate())) {
            throw new ConflictException("Ya existe una reserva confirmada o pendiente para esta habitación en las fechas seleccionadas.");
        }

        User tenant = userRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Inquilino no encontrado"));

        long days = ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate());
        BigDecimal dailyRate = room.getPricePerMonth().divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP);
        BigDecimal totalPrice = dailyRate.multiply(BigDecimal.valueOf(days)).add(room.getDepositPrice());

        Reservation reservation = Reservation.builder()
                .room(room)
                .tenant(tenant)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .totalPrice(totalPrice)
                .status(ReservationStatus.PENDING)
                .notes(request.getNotes())
                .build();

        // La habitación permanece disponible en el Landing Page hasta que el propietario acepte y confirme la reserva
        return bookingMapper.toDto(reservationRepository.save(reservation));
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponseDto getBookingById(Long id, String userEmail) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con ID: " + id));

        boolean isTenant = reservation.getTenant().getEmail().equals(userEmail);
        boolean isOwner = reservation.getRoom().getProperty().getOwner().getEmail().equals(userEmail);

        if (!isTenant && !isOwner) {
            throw new UnauthorizedException("No tiene permisos para ver esta reserva");
        }

        return bookingMapper.toDto(reservation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDto> getTenantBookings(String tenantEmail) {
        User tenant = userRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Inquilino no encontrado"));

        return reservationRepository.findByTenantId(tenant.getId()).stream()
                .map(bookingMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponseDto> getOwnerBookings(String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Propietario no encontrado"));

        return reservationRepository.findByRoomPropertyOwnerId(owner.getId()).stream()
                .map(bookingMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BookingResponseDto updateBookingStatus(Long bookingId, String newStatus, String userEmail) {
        Reservation reservation = reservationRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada"));

        boolean isOwner = reservation.getRoom().getProperty().getOwner().getEmail().equals(userEmail);
        if (!isOwner) {
            throw new UnauthorizedException("No posee permisos para modificar el estado de esta reserva");
        }

        ReservationStatus status;
        try {
            status = ReservationStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Estado de reserva no válido: " + newStatus);
        }

        reservation.setStatus(status);

        if (status == ReservationStatus.CONFIRMED) {
            Room room = reservation.getRoom();
            room.setStatus(RoomStatus.RENTED);
            roomRepository.save(room);
        } else if (status == ReservationStatus.REJECTED || status == ReservationStatus.CANCELLED) {
            Room room = reservation.getRoom();
            room.setStatus(RoomStatus.AVAILABLE);
            roomRepository.save(room);
        }

        return bookingMapper.toDto(reservationRepository.save(reservation));
    }
}
