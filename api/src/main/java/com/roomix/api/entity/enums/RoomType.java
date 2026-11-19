package com.roomix.api.entity.enums;

/**
 * Tipo de inmueble publicado, orientado al público al que se dirige.
 * (V5 reemplazó SINGLE / DOUBLE / SUITE / SHARED.)
 */
public enum RoomType {
    /** Cuarto: estudiantes. */
    ROOM,
    /** Minidepartamento: parejas. */
    MINI_APARTMENT,
    /** Departamento: familias grandes. */
    APARTMENT,
    /** Casa entera. */
    HOUSE
}
