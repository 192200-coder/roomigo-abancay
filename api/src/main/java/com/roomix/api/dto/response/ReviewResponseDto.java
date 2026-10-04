package com.roomix.api.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponseDto {

    private Long id;
    private Long roomId;
    private String authorName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
