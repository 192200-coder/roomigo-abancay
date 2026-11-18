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
import com.roomix.api.event.DomainEvents;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final BookingMapper bookingMapper;
    private final ApplicationEventPublisher events;

    @Override
    @Transactional
    public BookingResponseDto createBooking(BookingRequestDto request, String tenantEmail) {
        int months = request.getMonths();
        LocalDate startDate = request.getStartDate();
        LocalDate endDate = startDate.plusMonths(months);

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Habitación no encontrada"));

        if (room.getStatus() != RoomStatus.AVAILABLE) {
            throw new BadRequestException("La habitación no se encuentra disponible para reserva");
        }

        if (reservationRepository.existsOverlappingReservation(room.getId(), startDate, endDate)) {
            throw new ConflictException("Ya existe una reserva confirmada o pendiente para esta habitación en las fechas seleccionadas.");
        }

        User tenant = userRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Inquilino no encontrado"));

        // Total = renta mensual × meses contratados + depósito de garantía (una sola vez)
        BigDecimal totalPrice = room.getPricePerMonth()
                .multiply(BigDecimal.valueOf(months))
                .add(room.getDepositPrice());
        // Lo que se cobra al pagar la reserva aprobada: primer mes + depósito
        BigDecimal initialPayment = room.getPricePerMonth().add(room.getDepositPrice());

        Reservation reservation = Reservation.builder()
                .room(room)
                .tenant(tenant)
                .startDate(startDate)
                .endDate(endDate)
                .months(months)
                .totalPrice(totalPrice)
                .initialPayment(initialPayment)
                .status(ReservationStatus.PENDING)
                .notes(request.getNotes())
                .build();

        // La habitación permanece disponible en el Landing Page hasta que el propietario acepte y confirme la reserva
        Reservation saved = reservationRepository.save(reservation);
        events.publishEvent(new DomainEvents.BookingRequested(saved.getId()));
        return bookingMapper.toDto(saved);
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

        // Al aprobar (CONFIRMED) el cuarto sigue publicado: pasa a RENTED recién cuando el
        // inquilino paga por Mercado Pago (ver PaymentServiceImpl). Las fechas ya quedan
        // protegidas porque existsOverlappingReservation considera reservas confirmadas.
        if (status == ReservationStatus.REJECTED || status == ReservationStatus.CANCELLED) {
            Room room = reservation.getRoom();
            room.setStatus(RoomStatus.AVAILABLE);
            roomRepository.save(room);
        }

        Reservation updated = reservationRepository.save(reservation);
        events.publishEvent(new DomainEvents.BookingStatusChanged(updated.getId(), status));
        return bookingMapper.toDto(updated);
    }
}
