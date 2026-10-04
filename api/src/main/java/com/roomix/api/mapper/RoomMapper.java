package com.roomix.api.mapper;

import com.roomix.api.dto.response.RoomResponseDto;
import com.roomix.api.entity.Room;
import org.springframework.stereotype.Component;

@Component
public class RoomMapper {

    public RoomResponseDto toDto(Room room) {
        if (room == null) return null;

        return RoomResponseDto.builder()
                .id(room.getId())
                .propertyId(room.getProperty() != null ? room.getProperty().getId() : null)
                .propertyCity(room.getProperty() != null ? room.getProperty().getCity() : null)
                .propertyAddress(room.getProperty() != null ? room.getProperty().getAddress() : null)
                .title(room.getTitle())
                .description(room.getDescription())
                .pricePerMonth(room.getPricePerMonth())
                .depositPrice(room.getDepositPrice())
                .roomType(room.getRoomType())
                .status(room.getStatus())
                .privateBathroom(room.isPrivateBathroom())
                .capacity(room.getCapacity())
                .sizeSqm(room.getSizeSqm())
                .offersWifi(room.isOffersWifi())
                .acceptsPets(room.isAcceptsPets())
                .mainImageUrl(room.getMainImageUrl())
                .averageRating(room.getAverageRating())
                .totalReviews(room.getTotalReviews())
                .publicationFeePaid(room.isPublicationFeePaid())
                .paymentMethod(room.getPaymentMethod())
                .paymentReference(room.getPaymentReference())
                .publicationFeeAmount(room.getPublicationFeeAmount())
                .ownerName(room.getProperty() != null && room.getProperty().getOwner() != null ? room.getProperty().getOwner().getFirstName() + " " + room.getProperty().getOwner().getLastName() : null)
                .ownerEmail(room.getProperty() != null && room.getProperty().getOwner() != null ? room.getProperty().getOwner().getEmail() : null)
                .ownerPhone(room.getProperty() != null && room.getProperty().getOwner() != null ? room.getProperty().getOwner().getPhone() : null)
                .createdAt(room.getCreatedAt())
                .build();
    }
}
