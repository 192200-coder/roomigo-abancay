package com.roomix.api.dto.common;

import com.roomix.api.entity.enums.PhotoCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

/** Una foto de la publicación y qué muestra. Se usa tanto al publicar como en el detalle. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomPhotoDto {

    @NotBlank(message = "Cada foto necesita una imagen")
    private String url;

    @NotNull(message = "Indica qué muestra cada foto")
    private PhotoCategory category;
}
