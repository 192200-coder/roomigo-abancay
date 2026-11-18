package com.roomix.api.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDto {
    private Long id;
    /** Ver {@link com.roomix.api.entity.enums.NotificationType}. */
    private String type;
    private String title;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;
}
