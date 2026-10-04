package com.roomix.api.mapper;

import com.roomix.api.dto.response.UserResponseDto;
import com.roomix.api.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponseDto toDto(User user) {
        if (user == null) {
            return null;
        }

        return UserResponseDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .profileImage(user.getProfileImage())
                .role(user.getRole() != null ? user.getRole().getName().name() : null)
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
