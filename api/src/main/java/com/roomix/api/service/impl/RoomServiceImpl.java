package com.roomix.api.service.impl;

import com.roomix.api.dto.common.PageResponseDto;
import com.roomix.api.dto.common.RoomPhotoDto;
import com.roomix.api.entity.enums.ListingOperation;
import com.roomix.api.entity.enums.PhotoCategory;
import com.roomix.api.entity.enums.RoomType;
import com.roomix.api.repository.VisitRequestRepository;
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
import com.roomix.api.event.DomainEvents;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
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
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final ReservationRepository reservationRepository;
    private final ReviewRepository reviewRepository;
    private final VisitRequestRepository visitRequestRepository;
    private final RoomMapper roomMapper;
    private final ApplicationEventPublisher events;

    /** Máximo de fotos por publicación (3 obligatorias + hasta 5 adicionales). */
    static final int MAX_PHOTOS = 8;
    /** Tope por foto en base64 (~2,2 MB de imagen). El frontend las comprime antes de enviarlas. */
    static final int MAX_PHOTO_CHARS = 3_000_000;

    @Override
    @Transactional
    public RoomResponseDto createRoom(RoomRequestDto request, String ownerEmail) {
        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new ResourceNotFoundException("Propiedad no encontrada"));

        if (!property.getOwner().getEmail().equals(ownerEmail)) {
            throw new UnauthorizedException("No posee permisos para agregar habitaciones a esta propiedad");
        }

        ListingOperation operation = request.getOperation() != null ? request.getOperation() : ListingOperation.RENT;
        validatePhotos(request.getPhotos());

        Room room = Room.builder()
                .property(property)
                .title(request.getTitle())
                .description(request.getDescription())
                .operation(operation)
                .pricePerMonth(request.getPricePerMonth())
                .depositPrice(request.getDepositPrice())
                .salePrice(request.getSalePrice())
                .roomType(request.getRoomType())
                .status(RoomStatus.PENDING_APPROVAL)
                .publicationFeePaid(false)
                .paymentMethod(null)
                .paymentReference(null)
                .privateBathroom(request.isPrivateBathroom())
                .capacity(request.getCapacity())
                .sizeSqm(request.getSizeSqm())
                .landAreaSqm(request.getLandAreaSqm())
                .bedrooms(request.getBedrooms())
                .bathrooms(request.getBathrooms())
                .offersWifi(request.isOffersWifi())
                .acceptsPets(request.isAcceptsPets())
                .build();

        normalizeAndValidateListing(room);
        replacePhotos(room, request.getPhotos());
        room.setMainImageUrl(hasText(request.getMainImageUrl())
                ? request.getMainImageUrl().trim()
                : request.getPhotos().get(0).getUrl().trim());

        return roomMapper.toDto(roomRepository.save(room));
    }

    /**
     * Reglas que dependen de la operación. Se aplican sobre la entidad (no sobre la petición)
     * para que también valgan al editar solo algunos campos.
     */
    private static void normalizeAndValidateListing(Room room) {
        if (room.getRoomType() == null) {
            throw new BadRequestException("El tipo de inmueble es obligatorio");
        }
        if (room.isForSale()) {
            if (room.getRoomType() == RoomType.ROOM) {
                throw new BadRequestException("Un cuarto solo puede publicarse en alquiler. Para vender, elige minidepartamento, departamento o casa entera.");
            }
            if (room.getSalePrice() == null || room.getSalePrice().signum() <= 0) {
                throw new BadRequestException("Indica el precio de venta");
            }
            // En venta no hay renta ni depósito: se limpian para que no se muestren ni se cobren.
            room.setPricePerMonth(null);
            room.setDepositPrice(null);
        } else {
            if (room.getPricePerMonth() == null || room.getPricePerMonth().signum() <= 0) {
                throw new BadRequestException("Indica la renta mensual");
            }
            if (room.getDepositPrice() == null || room.getDepositPrice().signum() < 0) {
                throw new BadRequestException("Indica el depósito de garantía (puede ser 0)");
            }
            room.setSalePrice(null);
        }
    }

    /** Toda publicación debe mostrar fachada, habitación y baño, con un máximo de {@value #MAX_PHOTOS} fotos. */
    static void validatePhotos(List<RoomPhotoDto> photos) {
        if (photos == null || photos.isEmpty()) {
            throw new BadRequestException("Agrega al menos 3 fotos: la fachada, la habitación y el baño");
        }
        if (photos.size() > MAX_PHOTOS) {
            throw new BadRequestException("Puedes subir como máximo " + MAX_PHOTOS + " fotos");
        }
        Set<PhotoCategory> present = EnumSet.noneOf(PhotoCategory.class);
        for (RoomPhotoDto photo : photos) {
            if (photo == null || !hasText(photo.getUrl()) || photo.getCategory() == null) {
                throw new BadRequestException("Cada foto necesita una imagen y una categoría");
            }
            String url = photo.getUrl().trim();
            boolean validFormat = url.startsWith("data:image/") || url.startsWith("https://") || url.startsWith("http://");
            if (!validFormat) {
                throw new BadRequestException("Formato de foto no válido");
            }
            if (url.length() > MAX_PHOTO_CHARS) {
                throw new BadRequestException("Una de las fotos es demasiado pesada (máximo ~2 MB)");
            }
            present.add(photo.getCategory());
        }
        Set<PhotoCategory> missing = EnumSet.copyOf(PhotoCategory.REQUIRED);
        missing.removeAll(present);
        if (!missing.isEmpty()) {
            throw new BadRequestException("Faltan fotos obligatorias: " + missing.stream()
                    .map(RoomServiceImpl::photoLabel)
                    .collect(Collectors.joining(", ")));
        }
    }

    private static String photoLabel(PhotoCategory category) {
        return switch (category) {
            case FACADE -> "fachada";
            case ROOM -> "habitación";
            case BATHROOM -> "baño";
            case LIVING_KITCHEN -> "sala o cocina";
            case OTHER -> "otra";
        };
    }

    private static void replacePhotos(Room room, List<RoomPhotoDto> photos) {
        room.getImages().clear();
        for (int i = 0; i < photos.size(); i++) {
            RoomPhotoDto photo = photos.get(i);
            room.getImages().add(RoomImage.builder()
                    .room(room)
                    .imageUrl(photo.getUrl().trim())
                    .category(photo.getCategory())
                    .isPrimary(i == 0)
                    .displayOrder(i)
                    .build());
        }
    }

    /** El propietario de la publicación o un administrador. */
    private void assertCanManage(Room room, String userEmail) {
        if (room.getProperty().getOwner().getEmail().equals(userEmail)) {
            return;
        }
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        boolean isAdmin = user.getRole() != null && "ROLE_ADMIN".equals(user.getRole().getName());
        if (!isAdmin) {
            throw new UnauthorizedException("No posee permisos sobre esta publicación");
        }
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    @Override
    @Transactional(readOnly = true)
    public RoomResponseDto getRoomById(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Habitación no encontrada con ID: " + id));
        return roomMapper.toDetailDto(room);
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
        Room saved = roomRepository.save(room);
        events.publishEvent(new DomainEvents.RoomModerated(saved.getId(), true, null));
        return roomMapper.toDto(saved);
    }

    @Override
    @Transactional
    public RoomResponseDto rejectRoom(Long id, String adminEmail, String reason) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Habitación no encontrada"));
        room.setStatus(RoomStatus.REJECTED);
        Room saved = roomRepository.save(room);
        events.publishEvent(new DomainEvents.RoomModerated(saved.getId(), false, reason));
        return roomMapper.toDto(saved);
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
    public RoomResponseDto updateRoom(Long id, RoomRequestDto request, String userEmail) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Habitación no encontrada con ID: " + id));
        assertCanManage(room, userEmail);
        if (request.getTitle() != null && !request.getTitle().isBlank()) room.setTitle(request.getTitle().trim());
        if (request.getDescription() != null) room.setDescription(request.getDescription().trim());
        if (request.getOperation() != null) room.setOperation(request.getOperation());
        if (request.getPricePerMonth() != null) room.setPricePerMonth(request.getPricePerMonth());
        if (request.getDepositPrice() != null) room.setDepositPrice(request.getDepositPrice());
        if (request.getSalePrice() != null) room.setSalePrice(request.getSalePrice());
        if (request.getRoomType() != null) room.setRoomType(request.getRoomType());
        room.setPrivateBathroom(request.isPrivateBathroom());
        room.setOffersWifi(request.isOffersWifi());
        room.setAcceptsPets(request.isAcceptsPets());
        if (request.getCapacity() != null) room.setCapacity(request.getCapacity());
        if (request.getSizeSqm() != null) room.setSizeSqm(request.getSizeSqm());
        if (request.getLandAreaSqm() != null) room.setLandAreaSqm(request.getLandAreaSqm());
        if (request.getBedrooms() != null) room.setBedrooms(request.getBedrooms());
        if (request.getBathrooms() != null) room.setBathrooms(request.getBathrooms());
        normalizeAndValidateListing(room);

        // Fotos: null conserva las actuales (las publicaciones antiguas no se bloquean);
        // una lista las reemplaza y debe cumplir las mismas reglas que al publicar.
        if (request.getPhotos() != null) {
            validatePhotos(request.getPhotos());
            replacePhotos(room, request.getPhotos());
            room.setMainImageUrl(request.getPhotos().get(0).getUrl().trim());
        } else if (hasText(request.getMainImageUrl())) {
            room.setMainImageUrl(request.getMainImageUrl().trim());
        }
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            try {
                room.setStatus(RoomStatus.valueOf(request.getStatus().trim()));
            } catch (Exception ignored) {}
        }
        return roomMapper.toDto(roomRepository.save(room));
    }

    @Override
    @Transactional
    public void deleteRoom(Long id, String userEmail) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Habitación no encontrada con ID: " + id));
        assertCanManage(room, userEmail);

        visitRequestRepository.deleteByRoomId(id);

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
