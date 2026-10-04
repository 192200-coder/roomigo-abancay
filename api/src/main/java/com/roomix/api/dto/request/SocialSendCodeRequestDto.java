package com.roomix.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SocialSendCodeRequestDto {

    @NotBlank(message = "El correo electrónico es obligatorio.")
    @Email(message = "El formato de correo no es válido.")
    private String email;

    @NotBlank(message = "El proveedor es obligatorio (GOOGLE o FACEBOOK).")
    private String provider;

    private String firstName;
    private String lastName;

    @Builder.Default
    private String role = "ROLE_TENANT";
}
