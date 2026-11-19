package com.roomix.api.repository.specification;

import com.roomix.api.dto.request.RoomFilterDto;
import com.roomix.api.entity.Property;
import com.roomix.api.entity.Room;
import com.roomix.api.entity.enums.ListingOperation;
import com.roomix.api.entity.enums.RoomStatus;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class RoomSpecification {

    public static Specification<Room> getRoomsByFilters(RoomFilterDto filter) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Únicamente publicaciones disponibles (en alquiler o en venta)
            predicates.add(criteriaBuilder.equal(root.get("status"), RoomStatus.AVAILABLE));

            if (filter != null) {
                if (StringUtils.hasText(filter.getCity())) {
                    Join<Room, Property> propertyJoin = root.join("property");
                    predicates.add(criteriaBuilder.like(
                            criteriaBuilder.lower(propertyJoin.get("city")),
                            "%" + filter.getCity().toLowerCase() + "%"
                    ));
                }

                if (filter.getOperation() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("operation"), filter.getOperation()));
                }

                // El rango de precio se compara con el precio de venta cuando se buscan ventas;
                // en cualquier otro caso, con la renta mensual.
                String priceField = filter.getOperation() == ListingOperation.SALE ? "salePrice" : "pricePerMonth";
                if (filter.getMinPrice() != null) {
                    predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get(priceField), filter.getMinPrice()));
                }

                if (filter.getMaxPrice() != null) {
                    predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get(priceField), filter.getMaxPrice()));
                }

                if (filter.getMinBedrooms() != null) {
                    predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("bedrooms"), filter.getMinBedrooms()));
                }

                if (filter.getRoomType() != null) {
                    predicates.add(criteriaBuilder.equal(
                            root.get("roomType"), filter.getRoomType()
                    ));
                }

                if (filter.getPrivateBathroom() != null) {
                    predicates.add(criteriaBuilder.equal(
                            root.get("privateBathroom"), filter.getPrivateBathroom()
                    ));
                }

                if (filter.getOffersWifi() != null) {
                    predicates.add(criteriaBuilder.equal(
                            root.get("offersWifi"), filter.getOffersWifi()
                    ));
                }

                if (filter.getAcceptsPets() != null) {
                    predicates.add(criteriaBuilder.equal(
                            root.get("acceptsPets"), filter.getAcceptsPets()
                    ));
                }

                if (filter.getMinRating() != null) {
                    predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                            root.get("averageRating"), filter.getMinRating()
                    ));
                }
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}