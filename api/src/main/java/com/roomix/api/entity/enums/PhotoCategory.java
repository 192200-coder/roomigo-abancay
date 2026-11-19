package com.roomix.api.entity.enums;

import java.util.EnumSet;
import java.util.Set;

/** Qué muestra cada foto de una publicación. */
public enum PhotoCategory {
    /** Fachada de la casa o del edificio. */
    FACADE,
    /** La habitación o un dormitorio. */
    ROOM,
    /** El baño. */
    BATHROOM,
    /** Sala o cocina. */
    LIVING_KITCHEN,
    /** Cualquier otra vista. */
    OTHER;

    /** Toda publicación nueva debe mostrar al menos fachada, habitación y baño. */
    public static final Set<PhotoCategory> REQUIRED = EnumSet.of(FACADE, ROOM, BATHROOM);
}
