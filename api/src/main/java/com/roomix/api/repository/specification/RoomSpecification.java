package com.roomix.api.repository.specification;

import com.roomix.api.dto.request.RoomFilterDto;
import com.roomix.api.entity.Property;
import com.roomix.api.entity.Room;
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

            // Únicamente habitaciones disponibles por defecto
            predicates.add(criteriaBuilder.equal(root.get("status"), RoomStatus.AVAILABLE));

            if (filter != null) {
                if (StringUtils.hasText(filter.getCity())) {
                    Join<Room, Property> propertyJoin = root.join("property");
                    predicates.add(criteriaBuilder.like(
                            criteriaBuilder.lower(propertyJoin.get("city")),
                            "%" + filter.getCity().toLowerCase() + "%"
                    ));
                }

                if (filter.getMinPrice() != null) {
                    predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                            root.get("pricePerMonth"), filter.getMinPrice()
                    ));
                }

                if (filter.getMaxPrice() != null) {
                    predicates.add(criteriaBuilder.lessThanOrEqualTo(
                            root.get("pricePerMonth"), filter.getMaxPrice()
                    ));
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