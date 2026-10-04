package com.roomix.api.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "amenities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Amenity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 60)
    private String name;

    @Column(length = 150)
    private String description;

    @Column(length = 50)
    private String icon;
}
