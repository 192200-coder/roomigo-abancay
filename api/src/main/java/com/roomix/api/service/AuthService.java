package com.roomix.api.service;

import com.roomix.api.dto.request.LoginRequestDto;
import com.roomix.api.dto.request.RegisterRequestDto;
import com.roomix.api.dto.request.SocialSendCodeRequestDto;
import com.roomix.api.dto.request.SocialVerifyCodeRequestDto;
import com.roomix.api.dto.response.AuthResponseDto;
import com.roomix.api.dto.response.SendCodeResponseDto;

public interface AuthService {
    AuthResponseDto register(RegisterRequestDto request);
    AuthResponseDto login(LoginRequestDto request);
    SendCodeResponseDto sendSocialVerificationCode(SocialSendCodeRequestDto request);
    AuthResponseDto verifySocialCode(SocialVerifyCodeRequestDto request);
}
