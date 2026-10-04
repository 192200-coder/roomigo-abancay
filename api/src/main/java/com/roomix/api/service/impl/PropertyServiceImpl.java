package com.roomix.api.service.impl;

import com.roomix.api.dto.request.PropertyRequestDto;
import com.roomix.api.dto.response.PropertyResponseDto;
import com.roomix.api.entity.Property;
import com.roomix.api.entity.User;
import com.roomix.api.exception.ResourceNotFoundException;
import com.roomix.api.exception.UnauthorizedException;
import com.roomix.api.mapper.PropertyMapper;
import com.roomix.api.repository.PropertyRepository;
import com.roomix.api.repository.UserRepository;
import com.roomix.api.service.PropertyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PropertyServiceImpl implements PropertyService {

    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final PropertyMapper propertyMapper;

    @Override
    @Transactional
    public PropertyResponseDto createProperty(PropertyRequestDto request, String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Propietario no encontrado"));

        Property property = Property.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .address(request.getAddress())
                .city(request.getCity())
                .country(request.getCountry())
                .latitude(request.getLatitude() != null ? java.math.BigDecimal.valueOf(request.getLatitude()) : null)
                .longitude(request.getLongitude() != null ? java.math.BigDecimal.valueOf(request.getLongitude()) : null)
                .owner(owner)
                .build();

        return propertyMapper.toDto(propertyRepository.save(property));
    }

    @Override
    @Transactional(readOnly = true)
    public PropertyResponseDto getPropertyById(Long id) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Propiedad no encontrada con ID: " + id));
        return propertyMapper.toDto(property);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PropertyResponseDto> getPropertiesByOwner(String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Propietario no encontrado"));

        return propertyRepository.findByOwnerId(owner.getId()).stream()
                .map(propertyMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteProperty(Long id, String ownerEmail) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Propiedad no encontrada con ID: " + id));

        if (!property.getOwner().getEmail().equals(ownerEmail)) {
            throw new UnauthorizedException("No tiene permisos para eliminar esta propiedad");
        }

        propertyRepository.delete(property);
    }
}