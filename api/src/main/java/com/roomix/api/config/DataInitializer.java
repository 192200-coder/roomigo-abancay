package com.roomix.api.config;

import com.roomix.api.entity.Property;
import com.roomix.api.entity.Role;
import com.roomix.api.entity.Room;
import com.roomix.api.entity.User;
import com.roomix.api.entity.enums.PropertyType;
import com.roomix.api.entity.enums.RoomStatus;
import com.roomix.api.entity.enums.RoomType;
import com.roomix.api.entity.enums.UserRole;
import com.roomix.api.entity.enums.UserStatus;
import com.roomix.api.repository.PropertyRepository;
import com.roomix.api.repository.RoleRepository;
import com.roomix.api.repository.RoomRepository;
import com.roomix.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Arrays;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final RoomRepository roomRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Inicializando roles base en el sistema...");

        Arrays.stream(UserRole.values()).forEach(userRole -> {
            if (roleRepository.findByName(userRole).isEmpty()) {
                Role role = Role.builder()
                        .name(userRole)
                        .description("Rol predeterminado " + userRole.name())
                        .build();
                roleRepository.save(role);
                log.info("Rol creado: {}", userRole.name());
            }
        });

        Role adminRole = roleRepository.findByName(UserRole.ROLE_ADMIN).orElseThrow();
        Role ownerRole = roleRepository.findByName(UserRole.ROLE_OWNER).orElseThrow();
        Role tenantRole = roleRepository.findByName(UserRole.ROLE_TENANT).orElseThrow();

        // 1. Asegurar Usuario Administrador General
        User admin = userRepository.findByEmail("admin@roomix.com").orElseGet(() -> {
            User newAdmin = User.builder()
                    .firstName("Administrador")
                    .lastName("General Abancay")
                    .email("admin@roomix.com")
                    .password(passwordEncoder.encode("admin123"))
                    .phone("+51 983 456 789")
                    .profileImage("https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80")
                    .role(adminRole)
                    .status(UserStatus.ACTIVE)
                    .build();
            log.info("Usuario Administrador General creado: admin@roomix.com / admin123");
            return userRepository.save(newAdmin);
        });

        // 2. Asegurar Propietario
        User owner = userRepository.findByEmail("propietario@roomix.com").orElseGet(() -> {
            User newOwner = User.builder()
                    .firstName("Carlos")
                    .lastName("Mendoza")
                    .email("propietario@roomix.com")
                    .password(passwordEncoder.encode("password123"))
                    .phone("+51 987 654 321")
                    .profileImage("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80")
                    .role(ownerRole)
                    .status(UserStatus.ACTIVE)
                    .build();
            return userRepository.save(newOwner);
        });

        // 3. Asegurar Inquilino
        userRepository.findByEmail("inquilino@roomix.com").orElseGet(() -> {
            User newTenant = User.builder()
                    .firstName("Valeria")
                    .lastName("Torres")
                    .email("inquilino@roomix.com")
                    .password(passwordEncoder.encode("password123"))
                    .phone("+51 912 345 678")
                    .profileImage("https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80")
                    .role(tenantRole)
                    .status(UserStatus.ACTIVE)
                    .build();
            return userRepository.save(newTenant);
        });

        // 4. Sembrar propiedades en Abancay, Apurímac si no existen
        boolean hasAbancayProps = propertyRepository.findAll().stream()
                .anyMatch(p -> "Abancay".equalsIgnoreCase(p.getCity()));

        if (!hasAbancayProps) {
            log.info("Sembrando propiedades y cuartos para la Provincia de Abancay, Región Apurímac...");

            Property propUnamba = Property.builder()
                    .owner(owner)
                    .title("Residencial Universitaria El Estudiante UNAMBA")
                    .description("Inmueble pensado para estudiantes y docentes universitarios, ubicado frente al campus principal de la UNAMBA en Tamburco. Zona tranquila y segura con transporte continuo.")
                    .address("Av. Garcilaso de la Vega s/n, Frente a Puerta 1 UNAMBA")
                    .city("Abancay")
                    .district("Tamburco")
                    .country("Perú")
                    .latitude(BigDecimal.valueOf(-13.623500))
                    .longitude(BigDecimal.valueOf(-72.871200))
                    .propertyType(PropertyType.APARTMENT)
                    .status("ACTIVE")
                    .build();
            propertyRepository.save(propUnamba);

            Property propCentro = Property.builder()
                    .owner(owner)
                    .title("Edificio Los Chankas - Centro de Abancay")
                    .description("Ubicación céntrica privilegiada a solo 2 cuadras de la Plaza Mayor de Abancay y Av. Arenas. Cerca a bancos, mercados, notarías y restaurantes.")
                    .address("Jr. Lima 340 con Jr. Arequipa")
                    .city("Abancay")
                    .district("Centro")
                    .country("Perú")
                    .latitude(BigDecimal.valueOf(-13.636100))
                    .longitude(BigDecimal.valueOf(-72.881400))
                    .propertyType(PropertyType.HOUSE)
                    .status("ACTIVE")
                    .build();
            propertyRepository.save(propCentro);

            Property propUtea = Property.builder()
                    .owner(owner)
                    .title("Condominio El Mirador UTEA")
                    .description("Edificio residencial a 3 minutos caminando de la Universidad Tecnológica de los Andes (UTEA). Excelente iluminación natural y clima agradable.")
                    .address("Av. Prado Alto 620, Urb. Las Américas")
                    .city("Abancay")
                    .district("Las Américas")
                    .country("Perú")
                    .latitude(BigDecimal.valueOf(-13.639800))
                    .longitude(BigDecimal.valueOf(-72.876500))
                    .propertyType(PropertyType.APARTMENT)
                    .status("ACTIVE")
                    .build();
            propertyRepository.save(propUtea);

            // Habitaciones en Abancay
            Room room1 = Room.builder()
                    .property(propUnamba)
                    .title("Habitación Amoblada con Baño Privado frente a UNAMBA")
                    .description("Ideal para estudiante o docente de la UNAMBA. Cuenta con cama de 1.5 plazas, escritorio amplio con luz led, clóset empotrado, baño completo con terma solar 24/7 y fibra óptica de 100 Mbps.")
                    .pricePerMonth(BigDecimal.valueOf(320.00))
                    .depositPrice(BigDecimal.valueOf(150.00))
                    .currency("PEN")
                    .roomType(RoomType.SINGLE)
                    .sizeSqm(18.0)
                    .capacity(1)
                    .floor(2)
                    .furnished(true)
                    .privateBathroom(true)
                    .offersWifi(true)
                    .acceptsPets(false)
                    .mainImageUrl("https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80")
                    .averageRating(4.9)
                    .totalReviews(8)
                    .status(RoomStatus.AVAILABLE)
                    .publicationFeePaid(true)
                    .paymentMethod("YAPE")
                    .paymentReference("YAP-839102")
                    .build();

            Room room2 = Room.builder()
                    .property(propCentro)
                    .title("Cuarto Ejecutivo en Av. Arenas con Balcón - Centro Abancay")
                    .description("Habitación espaciosa y bien iluminada en el centro de Abancay. Balcón con hermosa vista hacia las montañas y la ciudad, cama de 2 plazas, ropero y baño privado.")
                    .pricePerMonth(BigDecimal.valueOf(450.00))
                    .depositPrice(BigDecimal.valueOf(200.00))
                    .currency("PEN")
                    .roomType(RoomType.SUITE)
                    .sizeSqm(24.0)
                    .capacity(2)
                    .floor(3)
                    .furnished(true)
                    .privateBathroom(true)
                    .offersWifi(true)
                    .acceptsPets(false)
                    .mainImageUrl("https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80")
                    .averageRating(4.8)
                    .totalReviews(12)
                    .status(RoomStatus.AVAILABLE)
                    .publicationFeePaid(true)
                    .paymentMethod("PLIN")
                    .paymentReference("PLN-472910")
                    .build();

            Room room3 = Room.builder()
                    .property(propUtea)
                    .title("Minidepartamento para Estudiantes cerca a UTEA")
                    .description("Minidepartamento de 1 ambiente amplio con kitchenet, baño propio con agua caliente, lavandería comunitaria en azotea. A pasos de la UTEA.")
                    .pricePerMonth(BigDecimal.valueOf(500.00))
                    .depositPrice(BigDecimal.valueOf(250.00))
                    .currency("PEN")
                    .roomType(RoomType.DOUBLE)
                    .sizeSqm(30.0)
                    .capacity(2)
                    .floor(1)
                    .furnished(true)
                    .privateBathroom(true)
                    .offersWifi(true)
                    .acceptsPets(true)
                    .mainImageUrl("https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80")
                    .averageRating(5.0)
                    .totalReviews(15)
                    .status(RoomStatus.AVAILABLE)
                    .publicationFeePaid(true)
                    .paymentMethod("YAPE")
                    .paymentReference("YAP-918234")
                    .build();

            Room room4 = Room.builder()
                    .property(propUnamba)
                    .title("Cuarto Económico e Iluminado en Tamburco")
                    .description("Cuarto individual muy acogedor en segundo piso, ventana amplia, patio común, lavadero y tendal. Servicios de agua, luz y wifi incluidos.")
                    .pricePerMonth(BigDecimal.valueOf(230.00))
                    .depositPrice(BigDecimal.valueOf(100.00))
                    .currency("PEN")
                    .roomType(RoomType.SINGLE)
                    .sizeSqm(14.0)
                    .capacity(1)
                    .floor(2)
                    .furnished(true)
                    .privateBathroom(false)
                    .offersWifi(true)
                    .acceptsPets(false)
                    .mainImageUrl("https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80")
                    .averageRating(4.7)
                    .totalReviews(5)
                    .status(RoomStatus.AVAILABLE)
                    .publicationFeePaid(true)
                    .paymentMethod("YAPE")
                    .paymentReference("YAP-102934")
                    .build();

            // Habitación Pendiente de Aprobación para que el Administrador General la apruebe!
            Room roomPending = Room.builder()
                    .property(propCentro)
                    .title("Habitación Nueva con Vista Panorámica en Patibamba")
                    .description("Habitación a estrenar con piso de cerámico, closet nuevo y baño privado. Pagada mediante Yape por el propietario y pendiente de revisión por el Administrador General.")
                    .pricePerMonth(BigDecimal.valueOf(350.00))
                    .depositPrice(BigDecimal.valueOf(150.00))
                    .currency("PEN")
                    .roomType(RoomType.SINGLE)
                    .sizeSqm(20.0)
                    .capacity(1)
                    .floor(4)
                    .furnished(true)
                    .privateBathroom(true)
                    .offersWifi(true)
                    .acceptsPets(true)
                    .mainImageUrl("https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80")
                    .averageRating(4.9)
                    .totalReviews(3)
                    .status(RoomStatus.AVAILABLE)
                    .publicationFeePaid(true)
                    .paymentMethod("YAPE")
                    .paymentReference("YAP-998812-ABANCAY")
                    .build();

            roomRepository.saveAll(Arrays.asList(room1, room2, room3, room4, roomPending));
            log.info("Habitaciones de Abancay, Apurímac sembradas con éxito en PostgreSQL.");
        }
    }
}
