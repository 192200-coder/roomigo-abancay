package com.roomix.api;

import com.roomix.api.entity.*;
import com.roomix.api.entity.enums.*;
import com.roomix.api.payment.MercadoPagoClient;
import com.roomix.api.payment.MercadoPagoModels.PaymentInfo;
import com.roomix.api.payment.MercadoPagoModels.PreferenceResponse;
import com.roomix.api.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Notificaciones generadas por los eventos del negocio, recorriendo el flujo real por la API:
 * solicitud -> aprobación -> pago -> reseña, más la moderación del cuarto.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:roomix-notifications;MODE=PostgreSQL;DB_CLOSE_DELAY=-1")
class NotificationFlowIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private RoleRepository roleRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PropertyRepository propertyRepository;
    @Autowired private RoomRepository roomRepository;
    @Autowired private NotificationRepository notificationRepository;

    @MockitoBean private MercadoPagoClient mercadoPago;

    private User owner;
    private User tenant;
    private Room room;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        owner = saveUser("Olga", "owner-" + suffix + "@roomix.test", UserRole.ROLE_OWNER);
        tenant = saveUser("Tito", "tenant-" + suffix + "@roomix.test", UserRole.ROLE_TENANT);
        Property property = propertyRepository.save(Property.builder()
                .owner(owner).title("Casa " + suffix).address("Jr. Arequipa 300").city("Abancay").build());
        room = roomRepository.save(Room.builder()
                .property(property).title("Cuarto " + suffix)
                .pricePerMonth(new BigDecimal("450.00")).depositPrice(new BigDecimal("300.00"))
                .roomType(RoomType.ROOM).status(RoomStatus.AVAILABLE).build());
    }

    @Test
    void fullBookingFlowNotifiesTheRightPeople() throws Exception {
        // 1) Solicitud -> el propietario recibe aviso
        String body = "{\"roomId\":" + room.getId() + ",\"startDate\":\"" + LocalDate.now().plusDays(2) + "\",\"months\":3}";
        String created = mockMvc.perform(post("/api/v1/bookings").with(asTenant())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long bookingId = Long.parseLong(created.replaceAll(".*\"data\":\\{\"id\":(\\d+).*", "$1"));
        assertThat(types(owner)).containsExactly("BOOKING_REQUEST");
        assertThat(latest(owner).getMessage()).contains("Tito").contains("3 meses");

        // 2) Aprobación -> el inquilino recibe aviso con el monto a pagar
        mockMvc.perform(patch("/api/v1/bookings/" + bookingId + "/status").param("status", "CONFIRMED")
                        .with(user(owner.getEmail()).roles("OWNER")))
                .andExpect(status().isOk());
        assertThat(types(tenant)).containsExactly("BOOKING_APPROVED");
        assertThat(latest(tenant).getMessage()).contains("S/ 750.00");

        // 3) Pago acreditado -> avisos para ambos (una sola vez, aunque se confirme dos veces)
        when(mercadoPago.createPreference(any(), anyString())).thenReturn(new PreferenceResponse("pref", "https://mp.test/x", null));
        when(mercadoPago.getPayment("9001")).thenReturn(new PaymentInfo(9001L, "approved", "accredited", "BOOKING-" + bookingId,
                new BigDecimal("750.00"), "PEN", "yape", "digital_wallet", OffsetDateTime.now(), false));
        mockMvc.perform(post("/api/v1/payments/checkout/bookings/" + bookingId).with(asTenant())).andExpect(status().isOk());
        for (int i = 0; i < 2; i++) {
            mockMvc.perform(get("/api/v1/payments/mercadopago/confirm").param("paymentId", "9001").with(asTenant()))
                    .andExpect(status().isOk());
        }
        assertThat(types(tenant)).containsExactly("PAYMENT_CONFIRMED", "BOOKING_APPROVED");
        assertThat(types(owner)).containsExactly("PAYMENT_RECEIVED", "BOOKING_REQUEST");

        // 4) Reseña -> el propietario recibe aviso
        mockMvc.perform(post("/api/v1/reviews").with(asTenant()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookingId\":" + bookingId + ",\"rating\":5,\"comment\":\"Muy limpio y tranquilo\"}"))
                .andExpect(status().isCreated());
        assertThat(latest(owner).getType()).isEqualTo("REVIEW_RECEIVED");
    }

    @Test
    void rejectionAndModerationAreNotified() throws Exception {
        String body = "{\"roomId\":" + room.getId() + ",\"startDate\":\"" + LocalDate.now().plusDays(2) + "\",\"months\":1}";
        String created = mockMvc.perform(post("/api/v1/bookings").with(asTenant())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andReturn().getResponse().getContentAsString();
        long bookingId = Long.parseLong(created.replaceAll(".*\"data\":\\{\"id\":(\\d+).*", "$1"));
        mockMvc.perform(patch("/api/v1/bookings/" + bookingId + "/status").param("status", "REJECTED")
                .with(user(owner.getEmail()).roles("OWNER"))).andExpect(status().isOk());
        assertThat(types(tenant)).containsExactly("BOOKING_REJECTED");

        mockMvc.perform(patch("/api/v1/admin/rooms/" + room.getId() + "/reject").param("reason", "Fotos borrosas")
                .with(user("admin@roomix.com").roles("ADMIN"))).andExpect(status().isOk());
        assertThat(latest(owner).getType()).isEqualTo("ROOM_REJECTED");
        assertThat(latest(owner).getMessage()).contains("Fotos borrosas");
    }

    @Test
    void usersReadAndMarkOnlyTheirOwnNotifications() throws Exception {
        Notification mine = notificationRepository.save(Notification.builder().user(tenant)
                .type("BOOKING_APPROVED").title("A").message("a").build());
        notificationRepository.save(Notification.builder().user(tenant).type("BOOKING_REJECTED").title("B").message("b").build());
        Notification others = notificationRepository.save(Notification.builder().user(owner)
                .type("BOOKING_REQUEST").title("C").message("c").build());

        mockMvc.perform(get("/api/v1/notifications/unread-count").with(asTenant()))
                .andExpect(jsonPath("$.data.count").value(2));
        mockMvc.perform(get("/api/v1/notifications").with(asTenant()))
                .andExpect(jsonPath("$.data.content.length()").value(2))
                .andExpect(jsonPath("$.data.content[0].title").value("B"));

        mockMvc.perform(patch("/api/v1/notifications/" + mine.getId() + "/read").with(asTenant()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.read").value(true));
        mockMvc.perform(patch("/api/v1/notifications/" + others.getId() + "/read").with(asTenant()))
                .andExpect(status().isNotFound());

        mockMvc.perform(patch("/api/v1/notifications/read-all").with(asTenant()))
                .andExpect(jsonPath("$.data.updated").value(1));
        mockMvc.perform(get("/api/v1/notifications/unread-count").with(asTenant()))
                .andExpect(jsonPath("$.data.count").value(0));
        assertThat(notificationRepository.findById(others.getId()).orElseThrow().getIsRead()).isFalse();

        mockMvc.perform(get("/api/v1/notifications/unread-count")).andExpect(status().isUnauthorized());
    }

    private RequestPostProcessor asTenant() {
        return user(tenant.getEmail()).roles("TENANT");
    }

    private List<String> types(User u) {
        return notificationRepository.findByUserIdOrderByCreatedAtDescIdDesc(u.getId(), org.springframework.data.domain.Pageable.unpaged())
                .map(Notification::getType).getContent();
    }

    private Notification latest(User u) {
        return notificationRepository.findByUserIdOrderByCreatedAtDescIdDesc(u.getId(), org.springframework.data.domain.PageRequest.of(0, 1))
                .getContent().getFirst();
    }

    private User saveUser(String name, String email, UserRole role) {
        return userRepository.save(User.builder().firstName(name).lastName("Test").email(email).password("x")
                .role(roleRepository.findByName(role).orElseThrow()).build());
    }
}
