package com.roomix.api.service.impl;

import com.roomix.api.dto.common.PageResponseDto;
import com.roomix.api.dto.request.RoomFilterDto;
import com.roomix.api.dto.request.RoomRequestDto;
import com.roomix.api.dto.response.RoomResponseDto;
import com.roomix.api.entity.Property;
import com.roomix.api.entity.Room;
import com.roomix.api.entity.RoomImage;
import com.roomix.api.entity.enums.RoomStatus;
import com.roomix.api.exception.BadRequestException;
import com.roomix.api.exception.ResourceNotFoundException;
import com.roomix.api.exception.UnauthorizedException;
import com.roomix.api.mapper.RoomMapper;
import com.roomix.api.repository.PropertyRepository;
import com.roomix.api.repository.RoomRepository;
import com.roomix.api.repository.specification.RoomSpecification;
import com.roomix.api.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.roomix.api.entity.User;
import com.roomix.api.entity.Reservation;
import com.roomix.api.entity.Review;
import com.roomix.api.repository.UserRepository;
import com.roomix.api.repository.ReservationRepository;
import com.roomix.api.repository.ReviewRepository;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final ReservationRepository reservationRepository;
    private final ReviewRepository reviewRepository;
    private final RoomMapper roomMapper;

    @Override
    @Transactional
    public RoomResponseDto createRoom(RoomRequestDto request, String ownerEmail) {
        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new ResourceNotFoundException("Propiedad no encontrada"));

        if (!property.getOwner().getEmail().equals(ownerEmail)) {
            throw new UnauthorizedException("No posee permisos para agregar habitaciones a esta propiedad");
        }

        Room room = Room.builder()
                .property(property)
                .title(request.getTitle())
                .description(request.getDescription())
                .pricePerMonth(request.getPricePerMonth())
                .depositPrice(request.getDepositPrice())
                .roomType(request.getRoomType())
                .status(RoomStatus.PENDING_APPROVAL)
                .publicationFeePaid(false)
                .paymentMethod(null)
                .paymentReference(null)
                .privateBathroom(request.isPrivateBathroom())
                .capacity(request.getCapacity())
                .sizeSqm(request.getSizeSqm())
                .offersWifi(request.isOffersWifi())
                .acceptsPets(request.isAcceptsPets())
                .mainImageUrl(request.getMainImageUrl())
                .build();

        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            for (int i = 0; i < request.getImageUrls().size(); i++) {
                String imgUrl = request.getImageUrls().get(i);
                if (imgUrl != null && !imgUrl.trim().isEmpty()) {
                    RoomImage roomImg = RoomImage.builder()
                            .room(room)
                            .imageUrl(imgUrl)
                            .isPrimary(i == 0)
                            .displayOrder(i)
                            .build();
                    room.getImages().add(roomImg);
                }
            }
        }

        return roomMapper.toDto(roomRepository.save(room));
    }

    @Override
    @Transactional(readOnly = true)
    public RoomResponseDto getRoomById(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Habitación no encontrada con ID: " + id));
        return roomMapper.toDto(room);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomResponseDto> getRoomsByOwner(String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        return roomRepository.findByPropertyOwnerId(owner.getId(), Pageable.unpaged())
                .map(roomMapper::toDto)
                .getContent();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponseDto<RoomResponseDto> searchRooms(RoomFilterDto filter, Pageable pageable) {
        Page<Room> page = roomRepository.findAll(RoomSpecification.getRoomsByFilters(filter), pageable);
        return PageResponseDto.fromPage(page.map(roomMapper::toDto));
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomResponseDto> getPendingRooms() {
        return roomRepository.findByStatusOrderByCreatedAtDesc(RoomStatus.PENDING_APPROVAL).stream()
                .map(roomMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomResponseDto> getAllRoomsForAdmin() {
        return roomRepository.findAll().stream()
                .map(roomMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RoomResponseDto approveRoom(Long id, String adminEmail) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Habitación no encontrada"));
        room.setStatus(RoomStatus.AVAILABLE);
        return roomMapper.toDto(roomRepository.save(room));
    }

    @Override
    @Transactional
    public RoomResponseDto rejectRoom(Long id, String adminEmail, String reason) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Habitación no encontrada"));
        room.setStatus(RoomStatus.REJECTED);
        return roomMapper.toDto(roomRepository.save(room));
    }

    @Override
    @Transactional
    public RoomResponseDto updateRoomStatus(Long id, String status, String userEmail) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Habitación no encontrada"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        boolean isOwner = room.getProperty().getOwner().getEmail().equals(userEmail);
        boolean isAdmin = user.getRole() != null && "ROLE_ADMIN".equals(user.getRole().getName());

        if (!isOwner && !isAdmin) {
            throw new UnauthorizedException("No posee permisos sobre esta habitación");
        }

        try {
            RoomStatus newStatus = RoomStatus.valueOf(status.toUpperCase());
            room.setStatus(newStatus);
            return roomMapper.toDto(roomRepository.save(room));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Estado de habitación inválido: " + status);
        }
    }

    @Override
    @Transactional
    public RoomResponseDto updateRoomLocation(Long id, java.util.Map<String, String> locationData) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Habitación no encontrada"));
        Property property = room.getProperty();
        if (locationData.containsKey("address") && locationData.get("address") != null && !locationData.get("address").isBlank()) {
            property.setAddress(locationData.get("address"));
        }
        if (locationData.containsKey("district") && locationData.get("district") != null && !locationData.get("district").isBlank()) {
            property.setDistrict(locationData.get("district"));
        }
        if (locationData.containsKey("city") && locationData.get("city") != null && !locationData.get("city").isBlank()) {
            property.setCity(locationData.get("city"));
        }
        if (locationData.containsKey("latitude") && locationData.get("latitude") != null && !locationData.get("latitude").isBlank()) {
            try { property.setLatitude(new java.math.BigDecimal(locationData.get("latitude"))); } catch (Exception ignored) {}
        }
        if (locationData.containsKey("longitude") && locationData.get("longitude") != null && !locationData.get("longitude").isBlank()) {
            try { property.setLongitude(new java.math.BigDecimal(locationData.get("longitude"))); } catch (Exception ignored) {}
        }
        propertyRepository.save(property);
        return roomMapper.toDto(room);
    }

    @Override
    @Transactional
    public RoomResponseDto updateRoom(Long id, RoomRequestDto request) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Habitación no encontrada con ID: " + id));
        if (request.getTitle() != null && !request.getTitle().isBlank()) room.setTitle(request.getTitle().trim());
        if (request.getDescription() != null) room.setDescription(request.getDescription().trim());
        if (request.getPricePerMonth() != null) room.setPricePerMonth(request.getPricePerMonth());
        if (request.getDepositPrice() != null) room.setDepositPrice(request.getDepositPrice());
        if (request.getRoomType() != null) room.setRoomType(request.getRoomType());
        room.setPrivateBathroom(request.isPrivateBathroom());
        room.setOffersWifi(request.isOffersWifi());
        room.setAcceptsPets(request.isAcceptsPets());
        if (request.getCapacity() != null) room.setCapacity(request.getCapacity());
        if (request.getSizeSqm() != null) room.setSizeSqm(request.getSizeSqm());
        if (request.getMainImageUrl() != null && !request.getMainImageUrl().isBlank()) room.setMainImageUrl(request.getMainImageUrl().trim());
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            try {
                room.setStatus(com.roomix.api.entity.enums.RoomStatus.valueOf(request.getStatus().trim()));
            } catch (Exception ignored) {}
        }
        return roomMapper.toDto(roomRepository.save(room));
    }

    @Override
    @Transactional
    public void deleteRoom(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Habitación no encontrada con ID: " + id));

        List<Review> reviews = reviewRepository.findByRoomId(id);
        if (reviews != null && !reviews.isEmpty()) {
            reviewRepository.deleteAll(reviews);
        }

        List<Reservation> reservations = reservationRepository.findByRoomId(id);
        if (reservations != null && !reservations.isEmpty()) {
            reservationRepository.deleteAll(reservations);
        }

        roomRepository.delete(room);
    }
}
