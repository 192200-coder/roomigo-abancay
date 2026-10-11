package com.roomix.api.service.impl;

import com.roomix.api.dto.request.LoginRequestDto;
import com.roomix.api.dto.request.RegisterRequestDto;
import com.roomix.api.dto.response.AuthResponseDto;
import com.roomix.api.entity.Role;
import com.roomix.api.entity.User;
import com.roomix.api.entity.enums.UserRole;
import com.roomix.api.entity.enums.UserStatus;
import com.roomix.api.exception.ConflictException;
import com.roomix.api.exception.ResourceNotFoundException;
import com.roomix.api.mapper.UserMapper;
import com.roomix.api.repository.RoleRepository;
import com.roomix.api.repository.UserRepository;
import com.roomix.api.security.JwtTokenProvider;
import com.roomix.api.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.roomix.api.dto.request.SocialSendCodeRequestDto;
import com.roomix.api.dto.request.SocialVerifyCodeRequestDto;
import com.roomix.api.dto.response.SendCodeResponseDto;
import com.roomix.api.entity.VerificationCode;
import com.roomix.api.exception.UnauthorizedException;
import com.roomix.api.repository.VerificationCodeRepository;
import com.roomix.api.service.EmailService;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;
    private final VerificationCodeRepository verificationCodeRepository;
    private final EmailService emailService;
    private final com.roomix.api.security.LoginAttemptService loginAttemptService;
    private final com.roomix.api.security.InputSanitizer inputSanitizer;

    @Override
    @Transactional
    public AuthResponseDto register(RegisterRequestDto request) {
        String cleanEmail = request.getEmail().toLowerCase().trim();
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new ConflictException("El correo electrónico ya se encuentra registrado.");
        }

        Role role = roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new ResourceNotFoundException("El rol especificado no existe."));

        User user = User.builder()
                .firstName(inputSanitizer.sanitizeText(request.getFirstName()))
                .lastName(inputSanitizer.sanitizeText(request.getLastName()))
                .email(cleanEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(inputSanitizer.sanitizeText(request.getPhone()))
                .role(role)
                .status(UserStatus.ACTIVE)
                .build();

        User savedUser = userRepository.save(user);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(cleanEmail, request.getPassword())
        );

        String token = tokenProvider.generateToken(authentication);

        return AuthResponseDto.builder()
                .accessToken(token)
                .user(userMapper.toDto(savedUser))
                .build();
    }

    @Override
    public AuthResponseDto login(LoginRequestDto request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        if (loginAttemptService.isBlocked(normalizedEmail)) {
            int remaining = loginAttemptService.getRemainingMinutes(normalizedEmail);
            throw new UnauthorizedException("Demasiados intentos fallidos. Su cuenta ha sido bloqueada temporalmente por seguridad. Reintente en " + remaining + " minuto(s).");
        }

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
            );
            loginAttemptService.loginSucceeded(normalizedEmail);
        } catch (org.springframework.security.core.AuthenticationException ex) {
            loginAttemptService.loginFailed(normalizedEmail);
            throw ex;
        }

        String token = tokenProvider.generateToken(authentication);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado."));

        return AuthResponseDto.builder()
                .accessToken(token)
                .user(userMapper.toDto(user))
                .build();
    }

    @Override
    @Transactional
    public SendCodeResponseDto sendSocialVerificationCode(SocialSendCodeRequestDto request) {
        String email = request.getEmail().toLowerCase().trim();
        String code = String.format("%06d", new SecureRandom().nextInt(1_000_000));
        String provider = request.getProvider() != null ? request.getProvider().toUpperCase() : "GOOGLE";
        String fullName = (request.getFirstName() != null ? request.getFirstName() : "")
                + " " + (request.getLastName() != null ? request.getLastName() : "");

        VerificationCode verificationCode = VerificationCode.builder()
                .email(email)
                .code(code)
                .provider(provider)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .roleName(request.getRole() != null ? request.getRole() : "ROLE_TENANT")
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .used(false)
                .build();

        verificationCodeRepository.save(verificationCode);

        emailService.sendVerificationCode(email, code, provider, fullName.trim());

        return SendCodeResponseDto.builder()
                .email(email)
                .provider(provider)
                .codeSent(true)
                .expiresInSeconds(600)
                .message("Código de verificación de 6 dígitos enviado exitosamente a tu correo.")
                .devCode(code)
                .build();
    }

    @Override
    @Transactional
    public AuthResponseDto verifySocialCode(SocialVerifyCodeRequestDto request) {
        String email = request.getEmail().toLowerCase().trim();
        String inputCode = request.getCode().trim();

        VerificationCode record = verificationCodeRepository
                .findTopByEmailIgnoreCaseAndCodeAndUsedFalseOrderByCreatedAtDesc(email, inputCode)
                .orElseThrow(() -> new UnauthorizedException("El código de verificación ingresado no es válido o ya fue utilizado."));

        if (record.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new UnauthorizedException("El código de verificación ha expirado. Por favor solicita un nuevo código.");
        }

        record.setUsed(true);
        verificationCodeRepository.save(record);

        // Buscar si ya existe el usuario en PostgreSQL
        Optional<User> existingUserOpt = userRepository.findByEmail(email);
        User user;

        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
            if (user.getStatus() != UserStatus.ACTIVE) {
                user.setStatus(UserStatus.ACTIVE);
                user = userRepository.save(user);
            }
        } else {
            // Crear usuario real en base de datos PostgreSQL
            String roleName = request.getRole();
            if (roleName == null || roleName.trim().isEmpty()) {
                roleName = record.getRoleName() != null ? record.getRoleName() : "ROLE_TENANT";
            }

            UserRole userRoleEnum = UserRole.ROLE_TENANT;
            try {
                userRoleEnum = UserRole.valueOf(roleName.toUpperCase().trim());
            } catch (Exception ignored) {
                userRoleEnum = UserRole.ROLE_TENANT;
            }

            Role role = roleRepository.findByName(userRoleEnum)
                    .orElseGet(() -> roleRepository.findByName(UserRole.ROLE_TENANT)
                            .orElseThrow(() -> new ResourceNotFoundException("El rol especificado no existe.")));

            String firstName = (request.getFirstName() != null && !request.getFirstName().trim().isEmpty())
                    ? request.getFirstName().trim()
                    : (record.getFirstName() != null ? record.getFirstName() : "Usuario");

            String lastName = (request.getLastName() != null && !request.getLastName().trim().isEmpty())
                    ? request.getLastName().trim()
                    : (record.getLastName() != null ? record.getLastName() : (request.getProvider().equalsIgnoreCase("GOOGLE") ? "Google" : "Facebook"));

            String defaultAvatar = request.getProvider().equalsIgnoreCase("FACEBOOK")
                    ? "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80"
                    : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80";

            user = User.builder()
                    .email(email)
                    .firstName(firstName)
                    .lastName(lastName)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .phone(request.getPhone() != null ? request.getPhone() : "+51 983 000 000")
                    .profileImage(request.getAvatarUrl() != null ? request.getAvatarUrl() : defaultAvatar)
                    .role(role)
                    .status(UserStatus.ACTIVE)
                    .build();

            user = userRepository.save(user);
        }

        String token = tokenProvider.generateToken(user.getEmail());

        return AuthResponseDto.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .user(userMapper.toDto(user))
                .build();
    }
}