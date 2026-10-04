package com.roomix.api.entity;

import com.roomix.api.entity.enums.RoomStatus;
import com.roomix.api.entity.enums.RoomType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "rooms", indexes = {
        @Index(name = "idx_rooms_property", columnList = "property_id"),
        @Index(name = "idx_rooms_price", columnList = "price_per_month"),
        @Index(name = "idx_rooms_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "price_per_month", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerMonth;

    @Column(name = "deposit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal depositPrice;

    @Column(length = 3, nullable = false)
    @Builder.Default
    private String currency = "PEN";

    @Enumerated(EnumType.STRING)
    @Column(name = "room_type", nullable = false, length = 40)
    private RoomType roomType;

    @Column(name = "size_sqm")
    private Double sizeSqm;

    private Integer floor;

    @Column(nullable = false)
    @Builder.Default
    private Integer capacity = 1;

    @Column(nullable = false)
    @Builder.Default
    private Boolean furnished = true;

    @Column(name = "private_bathroom", nullable = false)
    @Builder.Default
    private boolean privateBathroom = false;

    @Column(name = "offers_wifi", nullable = false)
    @Builder.Default
    private boolean offersWifi = true;

    @Column(name = "accepts_pets", nullable = false)
    @Builder.Default
    private boolean acceptsPets = false;

    @Column(name = "main_image_url", columnDefinition = "TEXT")
    private String mainImageUrl;

    @Column(name = "average_rating")
    @Builder.Default
    private Double averageRating = 0.0;

    @Column(name = "total_reviews", nullable = false)
    @Builder.Default
    private Integer totalReviews = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private RoomStatus status = RoomStatus.PENDING_APPROVAL;

    @Column(name = "publication_fee_paid", nullable = false)
    @Builder.Default
    private boolean publicationFeePaid = false;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "payment_reference", length = 100)
    private String paymentReference;

    @Column(name = "publication_fee_amount", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal publicationFeeAmount = new BigDecimal("15.00");

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<RoomImage> images = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "room_amenities",
            joinColumns = @JoinColumn(name = "room_id"),
            inverseJoinColumns = @JoinColumn(name = "amenity_id")
    )
    @Builder.Default
    private Set<Amenity> amenities = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public BigDecimal getPrice() {
        return pricePerMonth;
    }

    public void setPrice(BigDecimal price) {
        this.pricePerMonth = price;
    }
}
