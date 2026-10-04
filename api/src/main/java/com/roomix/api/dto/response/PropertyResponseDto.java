package com.roomix.api.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyResponseDto {

    private Long id;
    private String title;
    private String description;
    private String address;
    private String city;
    private String country;
    private Double latitude;
    private Double longitude;
    private UserResponseDto owner;
    private LocalDateTime createdAt;
}