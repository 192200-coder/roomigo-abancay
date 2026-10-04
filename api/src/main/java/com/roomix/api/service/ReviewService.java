package com.roomix.api.service;

import com.roomix.api.dto.request.ReviewRequestDto;
import com.roomix.api.dto.response.ReviewResponseDto;

import java.util.List;

public interface ReviewService {
    ReviewResponseDto createReview(ReviewRequestDto request, String tenantEmail);
    List<ReviewResponseDto> getReviewsByRoom(Long roomId);
}