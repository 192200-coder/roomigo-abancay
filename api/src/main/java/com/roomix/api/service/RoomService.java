package com.roomix.api.service;

import com.roomix.api.dto.common.PageResponseDto;
import com.roomix.api.dto.request.RoomFilterDto;
import com.roomix.api.dto.request.RoomRequestDto;
import com.roomix.api.dto.response.RoomResponseDto;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface RoomService {
    RoomResponseDto createRoom(RoomRequestDto request, String ownerEmail);
    RoomResponseDto getRoomById(Long id);
    /** Todas las habitaciones de las propiedades del propietario, en cualquier estado. */
    List<RoomResponseDto> getRoomsByOwner(String ownerEmail);
    PageResponseDto<RoomResponseDto> searchRooms(RoomFilterDto filter, Pageable pageable);
    RoomResponseDto updateRoomStatus(Long id, String status, String ownerEmail);
    List<RoomResponseDto> getPendingRooms();
    List<RoomResponseDto> getAllRoomsForAdmin();
    RoomResponseDto approveRoom(Long id, String adminEmail);
    RoomResponseDto rejectRoom(Long id, String adminEmail, String reason);
    RoomResponseDto updateRoomLocation(Long id, java.util.Map<String, String> locationData);
    RoomResponseDto updateRoom(Long id, RoomRequestDto request);
    void deleteRoom(Long id);
}

