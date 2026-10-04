package com.roomix.api.service;

import com.roomix.api.dto.request.PropertyRequestDto;
import com.roomix.api.dto.response.PropertyResponseDto;

import java.util.List;

public interface PropertyService {
    PropertyResponseDto createProperty(PropertyRequestDto request, String ownerEmail);
    PropertyResponseDto getPropertyById(Long id);
    List<PropertyResponseDto> getPropertiesByOwner(String ownerEmail);
    void deleteProperty(Long id, String ownerEmail);
}
