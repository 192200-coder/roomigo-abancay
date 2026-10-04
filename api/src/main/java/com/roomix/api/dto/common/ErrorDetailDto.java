package com.roomix.api.dto.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorDetailDto {

    private boolean success;
    private String message;
    private List<String> errors;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    public static ErrorDetailDto of(String message, List<String> errors) {
        return ErrorDetailDto.builder()
                .success(false)
                .message(message)
                .errors(errors)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
