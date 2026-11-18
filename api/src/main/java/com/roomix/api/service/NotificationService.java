package com.roomix.api.service;

import com.roomix.api.dto.common.PageResponseDto;
import com.roomix.api.dto.response.NotificationDto;
import com.roomix.api.entity.User;
import com.roomix.api.entity.enums.NotificationType;

public interface NotificationService {

    /** Crea una notificación para un usuario. */
    void notify(User user, NotificationType type, String title, String message);

    PageResponseDto<NotificationDto> getMyNotifications(String userEmail, int page, int size);

    long countUnread(String userEmail);

    NotificationDto markAsRead(Long notificationId, String userEmail);

    int markAllAsRead(String userEmail);
}
