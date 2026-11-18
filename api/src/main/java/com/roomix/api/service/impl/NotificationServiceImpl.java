package com.roomix.api.service.impl;

import com.roomix.api.dto.common.PageResponseDto;
import com.roomix.api.dto.response.NotificationDto;
import com.roomix.api.entity.Notification;
import com.roomix.api.entity.User;
import com.roomix.api.entity.enums.NotificationType;
import com.roomix.api.exception.ResourceNotFoundException;
import com.roomix.api.repository.NotificationRepository;
import com.roomix.api.repository.UserRepository;
import com.roomix.api.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final int TITLE_MAX = 100;

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void notify(User user, NotificationType type, String title, String message) {
        notificationRepository.save(Notification.builder()
                .user(user)
                .type(type.name())
                .title(title.length() > TITLE_MAX ? title.substring(0, TITLE_MAX - 1) + "…" : title)
                .message(message)
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponseDto<NotificationDto> getMyNotifications(String userEmail, int page, int size) {
        User user = findUser(userEmail);
        int safeSize = Math.max(1, Math.min(size, MAX_PAGE_SIZE));
        return PageResponseDto.fromPage(notificationRepository
                .findByUserIdOrderByCreatedAtDescIdDesc(user.getId(), PageRequest.of(Math.max(0, page), safeSize))
                .map(NotificationServiceImpl::toDto));
    }

    @Override
    @Transactional(readOnly = true)
    public long countUnread(String userEmail) {
        return notificationRepository.countByUserIdAndIsReadFalse(findUser(userEmail).getId());
    }

    @Override
    @Transactional
    public NotificationDto markAsRead(Long notificationId, String userEmail) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, findUser(userEmail).getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notificación no encontrada"));
        notification.setIsRead(true);
        return toDto(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public int markAllAsRead(String userEmail) {
        return notificationRepository.markAllAsRead(findUser(userEmail).getId());
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }

    private static NotificationDto toDto(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .read(Boolean.TRUE.equals(n.getIsRead()))
                .createdAt(n.getCreatedAt())
                .build();
    }
}
