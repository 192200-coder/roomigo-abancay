package com.roomix.api.dto.response;

import com.roomix.api.entity.enums.UserStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponseDto {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String profileImage;
    private String role;
    private UserStatus status;
    private LocalDateTime createdAt;
}
