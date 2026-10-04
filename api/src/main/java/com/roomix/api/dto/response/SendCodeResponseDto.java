package com.roomix.api.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendCodeResponseDto {

    private String email;
    private String provider;
    private boolean codeSent;
    private long expiresInSeconds;
    private String message;
    private String devCode;
}
