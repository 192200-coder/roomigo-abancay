package com.roomix.api.controller;

import com.roomix.api.dto.common.ApiResponseDto;
import com.roomix.api.dto.request.LoginRequestDto;
import com.roomix.api.dto.request.RegisterRequestDto;
import com.roomix.api.dto.response.AuthResponseDto;
import com.roomix.api.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.roomix.api.dto.request.SocialSendCodeRequestDto;
import com.roomix.api.dto.request.SocialVerifyCodeRequestDto;
import com.roomix.api.dto.response.SendCodeResponseDto;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Endpoints de Login y Registro de Usuarios")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Registro de usuario", description = "Registra un nuevo Propietario o Inquilino en el sistema.")
    public ResponseEntity<ApiResponseDto<AuthResponseDto>> register(@Valid @RequestBody RegisterRequestDto request) {
        AuthResponseDto response = authService.register(request);
        return new ResponseEntity<>(ApiResponseDto.success("Usuario registrado exitosamente", response), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    @Operation(summary = "Inicio de sesión", description = "Autentica un usuario y retorna un token JWT Bearer.")
    public ResponseEntity<ApiResponseDto<AuthResponseDto>> login(@Valid @RequestBody LoginRequestDto request) {
        AuthResponseDto response = authService.login(request);
        return ResponseEntity.ok(ApiResponseDto.success("Inicio de sesión exitoso", response));
    }

    @PostMapping("/social/send-code")
    @Operation(summary = "Enviar código de verificación para Google/Facebook", description = "Genera un código OTP de 6 dígitos y lo envía al correo del usuario.")
    public ResponseEntity<ApiResponseDto<SendCodeResponseDto>> sendSocialCode(@Valid @RequestBody SocialSendCodeRequestDto request) {
        SendCodeResponseDto response = authService.sendSocialVerificationCode(request);
        return ResponseEntity.ok(ApiResponseDto.success("Código de verificación enviado exitosamente", response));
    }

    @PostMapping("/social/verify")
    @Operation(summary = "Verificar código e iniciar sesión con Google/Facebook", description = "Valida el código de 6 dígitos, crea o activa al usuario en base de datos y retorna el token JWT.")
    public ResponseEntity<ApiResponseDto<AuthResponseDto>> verifySocialCode(@Valid @RequestBody SocialVerifyCodeRequestDto request) {
        AuthResponseDto response = authService.verifySocialCode(request);
        return ResponseEntity.ok(ApiResponseDto.success("Autenticación y verificación exitosa", response));
    }
}