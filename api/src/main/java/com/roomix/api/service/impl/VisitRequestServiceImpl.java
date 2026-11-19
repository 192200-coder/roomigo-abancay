package com.roomix.api.service.impl;

import com.roomix.api.dto.request.VisitRequestDto;
import com.roomix.api.dto.request.VisitStatusUpdateDto;
import com.roomix.api.dto.response.VisitRequestResponseDto;
import com.roomix.api.entity.Room;
import com.roomix.api.entity.User;
import com.roomix.api.entity.VisitRequest;
import com.roomix.api.entity.enums.RoomStatus;
import com.roomix.api.entity.enums.VisitRequestStatus;
import com.roomix.api.event.DomainEvents;
import com.roomix.api.exception.BadRequestException;
import com.roomix.api.exception.ConflictException;
import com.roomix.api.exception.ResourceNotFoundException;
import com.roomix.api.exception.UnauthorizedException;
import com.roomix.api.repository.RoomRepository;
import com.roomix.api.repository.UserRepository;
import com.roomix.api.repository.VisitRequestRepository;
import com.roomix.api.service.VisitRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VisitRequestServiceImpl implements VisitRequestService {

    private static final EnumSet<VisitRequestStatus> OPEN = EnumSet.of(VisitRequestStatus.PENDING, VisitRequestStatus.CONFIRMED);

    private final VisitRequestRepository visitRequestRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher events;

    @Override
    @Transactional
    public VisitRequestResponseDto create(VisitRequestDto request, String requesterEmail) {
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Publicación no encontrada"));
        if (!room.isForSale()) {
            throw new BadRequestException("Las visitas se agendan solo en publicaciones en venta. Esta publicación se reserva.");
        }
        if (room.getStatus() != RoomStatus.AVAILABLE) {
            throw new BadRequestException("Esta publicación ya no está disponible");
        }
        User requester = user(requesterEmail);
        if (room.getProperty().getOwner().getId().equals(requester.getId())) {
            throw new BadRequestException("No puedes agendar una visita a tu propia publicación");
        }
        if (visitRequestRepository.existsByRoomIdAndRequesterIdAndStatusIn(room.getId(), requester.getId(), OPEN)) {
            throw new ConflictException("Ya tienes un pedido de visita abierto para esta publicación");
        }

        VisitRequest saved = visitRequestRepository.save(VisitRequest.builder()
                .room(room)
                .requester(requester)
                .preferredDate(request.getPreferredDate())
                .preferredTime(request.getPreferredTime())
                .contactPhone(blankToNull(request.getContactPhone()))
                .message(blankToNull(request.getMessage()))
                .status(VisitRequestStatus.PENDING)
                .build());
        events.publishEvent(new DomainEvents.VisitRequested(saved.getId()));
        return toDto(saved, false);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VisitRequestResponseDto> getMine(String requesterEmail) {
        return visitRequestRepository.findByRequesterIdOrderByCreatedAtDesc(user(requesterEmail).getId()).stream()
                .map(v -> toDto(v, false))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VisitRequestResponseDto> getForOwner(String ownerEmail) {
        return visitRequestRepository.findByRoomPropertyOwnerIdOrderByCreatedAtDesc(user(ownerEmail).getId()).stream()
                .map(v -> toDto(v, true))
                .toList();
    }

    @Override
    @Transactional
    public VisitRequestResponseDto updateStatus(Long id, VisitStatusUpdateDto update, String userEmail) {
        VisitRequest visit = visitRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido de visita no encontrado"));
        User user = user(userEmail);
        boolean isOwner = visit.getRoom().getProperty().getOwner().getId().equals(user.getId());
        boolean isRequester = visit.getRequester().getId().equals(user.getId());
        VisitRequestStatus target = update.getStatus();

        switch (target) {
            case CONFIRMED, DECLINED -> {
                if (!isOwner) {
                    throw new UnauthorizedException("Solo el propietario puede responder este pedido");
                }
                if (visit.getStatus() != VisitRequestStatus.PENDING) {
                    throw new BadRequestException("Este pedido ya fue respondido");
                }
            }
            case CANCELLED -> {
                if (!isRequester && !isOwner) {
                    throw new UnauthorizedException("No puedes cancelar este pedido");
                }
                if (!OPEN.contains(visit.getStatus())) {
                    throw new BadRequestException("Este pedido ya no está activo");
                }
            }
            default -> throw new BadRequestException("Estado no válido para un pedido de visita");
        }

        visit.setStatus(target);
        if (isOwner && update.getNote() != null && !update.getNote().isBlank()) {
            visit.setOwnerNote(update.getNote().trim());
        }
        VisitRequest saved = visitRequestRepository.save(visit);
        events.publishEvent(new DomainEvents.VisitStatusChanged(saved.getId(), target, isRequester && !isOwner));
        return toDto(saved, isOwner);
    }

    private User user(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    /**
     * @param forOwner el propietario ve siempre el contacto del interesado; el interesado ve el
     *                 teléfono del propietario solo cuando la visita está confirmada.
     */
    private static VisitRequestResponseDto toDto(VisitRequest v, boolean forOwner) {
        Room room = v.getRoom();
        User owner = room.getProperty().getOwner();
        User requester = v.getRequester();
        boolean shareOwnerPhone = forOwner || v.getStatus() == VisitRequestStatus.CONFIRMED;
        return VisitRequestResponseDto.builder()
                .id(v.getId())
                .roomId(room.getId())
                .roomTitle(room.getTitle())
                .roomAddress(room.getProperty().getAddress())
                .roomMainImageUrl(room.getMainImageUrl())
                .salePrice(room.getSalePrice())
                .requesterName(requester.getFirstName() + " " + requester.getLastName())
                .requesterEmail(requester.getEmail())
                .contactPhone(v.getContactPhone() != null ? v.getContactPhone() : requester.getPhone())
                .ownerName(owner.getFirstName() + " " + owner.getLastName())
                .ownerPhone(shareOwnerPhone ? owner.getPhone() : null)
                .preferredDate(v.getPreferredDate())
                .preferredTime(v.getPreferredTime())
                .message(v.getMessage())
                .status(v.getStatus())
                .ownerNote(v.getOwnerNote())
                .createdAt(v.getCreatedAt())
                .build();
    }
}
