package com.roomix.api.config;

import com.roomix.api.entity.Role;
import com.roomix.api.entity.User;
import com.roomix.api.entity.enums.UserRole;
import com.roomix.api.entity.enums.UserStatus;
import com.roomix.api.repository.RoleRepository;
import com.roomix.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

/**
 * Inicializador de Infraestructura y Limpieza de Datos de Prueba.
 * Garantiza roles del sistema y cuenta administrativa, purgando registros mock de demostración.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        log.info("[SISTEMA] Verificando roles del sistema...");

        Arrays.stream(UserRole.values()).forEach(userRole -> {
            if (roleRepository.findByName(userRole).isEmpty()) {
                Role role = Role.builder()
                        .name(userRole)
                        .description("Rol predeterminado " + userRole.name())
                        .build();
                roleRepository.save(role);
                log.info("[SISTEMA] Rol garantizado: {}", userRole.name());
            }
        });

        Role adminRole = roleRepository.findByName(UserRole.ROLE_ADMIN).orElseThrow();

        // 1. Asegurar Usuario Administrador General de la Plataforma
        userRepository.findByEmail("admin@roomix.com").orElseGet(() -> {
            User newAdmin = User.builder()
                    .firstName("Administrador")
                    .lastName("General")
                    .email("admin@roomix.com")
                    .password(passwordEncoder.encode("admin123"))
                    .phone("+51 983 456 789")
                    .profileImage("https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80")
                    .role(adminRole)
                    .status(UserStatus.ACTIVE)
                    .build();
            log.info("[SISTEMA] Usuario Administrador General garantizado: admin@roomix.com");
            return userRepository.save(newAdmin);
        });

        // 2. Limpieza segura y directa de registros de prueba (anti-mock)
        log.info("[SISTEMA] Purgando registros mock y datos de prueba heredados...");
        try {
            jdbcTemplate.execute("DELETE FROM reviews WHERE reservation_id IN (SELECT id FROM reservations WHERE tenant_id IN (SELECT id FROM users WHERE email IN ('propietario@roomix.com', 'inquilino@roomix.com')) OR room_id IN (SELECT r.id FROM rooms r JOIN properties p ON p.id = r.property_id WHERE p.owner_id IN (SELECT id FROM users WHERE email = 'propietario@roomix.com')));");
            jdbcTemplate.execute("DELETE FROM payments WHERE reservation_id IN (SELECT id FROM reservations WHERE tenant_id IN (SELECT id FROM users WHERE email IN ('propietario@roomix.com', 'inquilino@roomix.com')) OR room_id IN (SELECT r.id FROM rooms r JOIN properties p ON p.id = r.property_id WHERE p.owner_id IN (SELECT id FROM users WHERE email = 'propietario@roomix.com')));");
            jdbcTemplate.execute("DELETE FROM reservations WHERE tenant_id IN (SELECT id FROM users WHERE email IN ('propietario@roomix.com', 'inquilino@roomix.com')) OR room_id IN (SELECT r.id FROM rooms r JOIN properties p ON p.id = r.property_id WHERE p.owner_id IN (SELECT id FROM users WHERE email = 'propietario@roomix.com'));");
            jdbcTemplate.execute("DELETE FROM room_images WHERE room_id IN (SELECT r.id FROM rooms r JOIN properties p ON p.id = r.property_id WHERE p.owner_id IN (SELECT id FROM users WHERE email = 'propietario@roomix.com'));");
            jdbcTemplate.execute("DELETE FROM rooms WHERE property_id IN (SELECT id FROM properties WHERE owner_id IN (SELECT id FROM users WHERE email = 'propietario@roomix.com'));");
            jdbcTemplate.execute("DELETE FROM properties WHERE owner_id IN (SELECT id FROM users WHERE email = 'propietario@roomix.com');");
            jdbcTemplate.execute("DELETE FROM users WHERE email IN ('propietario@roomix.com', 'inquilino@roomix.com');");
            log.info("[AUDITORÍA LIMPIEZA] Registros mock de prueba eliminados exitosamente de la base de datos.");
        } catch (Exception ex) {
            log.warn("[AUDITORÍA LIMPIEZA] Aviso al purgar registros de prueba: {}", ex.getMessage());
        }

        // 3. Aplicar Row Level Security (RLS) y blindaje de esquemas en Supabase
        log.info("[SEGURIDAD SUPABASE] Habilitando Row Level Security (RLS) en todas las tablas públicas...");
        java.util.List<String> tables = java.util.List.of(
                "users", "roles", "verification_codes", "properties", "rooms",
                "room_images", "amenities", "room_amenities", "reservations",
                "payments", "reviews", "favorites", "notifications"
        );

        for (String table : tables) {
            try {
                jdbcTemplate.execute("ALTER TABLE IF EXISTS public." + table + " ENABLE ROW LEVEL SECURITY;");
            } catch (Exception ex) {
                log.warn("[SEGURIDAD SUPABASE] Aviso habilitando RLS en {}: {}", table, ex.getMessage());
            }
        }

        try {
            jdbcTemplate.execute("""
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
                        REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
                        REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
                        REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;
                    END IF;
                    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                        REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
                        REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
                        REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM authenticated;
                    END IF;
                END $$;
                """);
            log.info("[SEGURIDAD SUPABASE] Permisos directos de PostgREST revocados. Columnas sensibles protegidas.");
        } catch (Exception ex) {
            log.warn("[SEGURIDAD SUPABASE] Aviso al revocar permisos públicos: {}", ex.getMessage());
        }

        log.info("[SISTEMA] Base de datos limpia y blindada con RLS lista para operar.");
    }
}
