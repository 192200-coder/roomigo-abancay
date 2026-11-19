package com.roomix.api.entity.enums;

public enum RoomStatus {
    PENDING_APPROVAL,
    AVAILABLE,
    RENTED,
    OCCUPIED,
    MAINTENANCE,
    REJECTED,
    /** Publicación en venta que ya se vendió. */
    SOLD
}
