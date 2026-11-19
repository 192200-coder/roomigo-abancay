package com.roomix.api.service;

import com.roomix.api.dto.request.VisitRequestDto;
import com.roomix.api.dto.request.VisitStatusUpdateDto;
import com.roomix.api.dto.response.VisitRequestResponseDto;

import java.util.List;

public interface VisitRequestService {
    VisitRequestResponseDto create(VisitRequestDto request, String requesterEmail);
    /** Pedidos que hizo el usuario autenticado. */
    List<VisitRequestResponseDto> getMine(String requesterEmail);
    /** Pedidos recibidos en las publicaciones del propietario autenticado. */
    List<VisitRequestResponseDto> getForOwner(String ownerEmail);
    VisitRequestResponseDto updateStatus(Long id, VisitStatusUpdateDto update, String userEmail);
}
