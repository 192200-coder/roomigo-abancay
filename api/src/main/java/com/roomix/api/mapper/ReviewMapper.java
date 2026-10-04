package com.roomix.api.mapper;

import com.roomix.api.dto.response.ReviewResponseDto;
import com.roomix.api.entity.Review;
import org.springframework.stereotype.Component;

@Component
public class ReviewMapper {

    public ReviewResponseDto toDto(Review review) {
        if (review == null) return null;

        String authorName = (review.getUser() != null)
                ? review.getUser().getFirstName() + " " + review.getUser().getLastName()
                : "Anónimo";

        return ReviewResponseDto.builder()
                .id(review.getId())
                .roomId(review.getRoom() != null ? review.getRoom().getId() : null)
                .authorName(authorName)
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
