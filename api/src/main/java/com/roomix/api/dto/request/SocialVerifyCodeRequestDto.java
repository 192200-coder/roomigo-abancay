package com.roomix.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SocialVerifyCodeRequestDto {

    @NotBlank(message = "El correo electrónico es obligatorio.")
    @Email(message = "El formato de correo no es válido.")
    private String email;

    @NotBlank(message = "El código de verificación es obligatorio.")
    @Size(min = 6, max = 6, message = "El código debe tener exactamente 6 dígitos.")
    private String code;

    @NotBlank(message = "El proveedor es obligatorio (GOOGLE o FACEBOOK).")
    private String provider;

    private String firstName;
    private String lastName;
    private String role;
    private String phone;
    private String avatarUrl;
}
