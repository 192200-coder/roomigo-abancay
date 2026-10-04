package com.roomix.api.mapper;

import com.roomix.api.dto.response.PropertyResponseDto;
import com.roomix.api.entity.Property;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PropertyMapper {

    private final UserMapper userMapper;

    public PropertyResponseDto toDto(Property property) {
        if (property == null) return null;

        return PropertyResponseDto.builder()
                .id(property.getId())
                .title(property.getTitle())
                .description(property.getDescription())
                .address(property.getAddress())
                .city(property.getCity())
                .country(property.getCountry())
                .latitude(property.getLatitude() != null ? property.getLatitude().doubleValue() : null)
                .longitude(property.getLongitude() != null ? property.getLongitude().doubleValue() : null)
                .owner(userMapper.toDto(property.getOwner()))
                .createdAt(property.getCreatedAt())
                .build();
    }
}
