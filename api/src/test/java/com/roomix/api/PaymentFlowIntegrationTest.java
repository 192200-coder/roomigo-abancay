package com.roomix.api;

import com.roomix.api.entity.*;
import com.roomix.api.entity.enums.*;
import com.roomix.api.payment.MercadoPagoClient;
import com.roomix.api.payment.MercadoPagoModels.PaymentInfo;
import com.roomix.api.payment.MercadoPagoModels.PreferenceRequest;
import com.roomix.api.payment.MercadoPagoModels.PreferenceResponse;
import com.roomix.api.payment.PaymentCompletedEvent;
import com.roomix.api.payment.WebhookSignatureValidator;
import com.roomix.api.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Flujo de pagos con Mercado Pago. El cliente HTTP de Mercado Pago se reemplaza por un mock:
 * se prueba nuestra lógica (permisos, montos, conciliación idempotente, firma del webhook).
 */
@SpringBootTest
@AutoConfigureMockMvc
@RecordApplicationEvents
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:roomix-payments;MODE=PostgreSQL;DB_CLOSE_DELAY=-1")
class PaymentFlowIntegrationTest {

    private static final String WEBHOOK_SECRET = "secreto-webhook-tests"; // ver src/test/resources/application.properties

    @Autowired private MockMvc mockMvc;
    @Autowired private ApplicationEvents events;
    @Autowired private RoleRepository roleRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PropertyRepository propertyRepository;
    @Autowired private RoomRepository roomRepository;
    @Autowired private ReservationRepository reservationRepository;
    @Autowired private PaymentRepository paymentRepository;

    @MockitoBean private MercadoPagoClient mercadoPago;

    private User tenant;
    private User owner;
    private Room room;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        owner = saveUser("owner-" + suffix + "@roomix.test", UserRole.ROLE_OWNER);
        tenant = saveUser("tenant-" + suffix + "@roomix.test", UserRole.ROLE_TENANT);
        Property property = propertyRepository.save(Property.builder()
                .owner(owner).title("Casa " + suffix).address("Jr. Lima 100").city("Abancay").build());
        room = roomRepository.save(Room.builder()
                .property(property).title("Cuarto " + suffix)
                .pricePerMonth(new BigDecimal("450.00")).depositPrice(new BigDecimal("300.00"))
                .roomType(RoomType.SINGLE).status(RoomStatus.AVAILABLE).build());
        when(mercadoPago.createPreference(any(), anyString()))
                .thenReturn(new PreferenceResponse("pref-" + suffix, "https://mp.test/checkout/" + suffix, null));
    }

    // ------------------------------------------------------------------ checkout

    @Test
    void bookingCheckoutRequiresApprovedReservation() throws Exception {
        Reservation reservation = saveReservation(ReservationStatus.PENDING);

        mockMvc.perform(post("/api/v1/payments/checkout/bookings/" + reservation.getId()).with(asTenant()))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(mercadoPago);
    }

    @Test
    void onlyTheTenantCanPayTheReservation() throws Exception {
        Reservation reservation = saveReservation(ReservationStatus.CONFIRMED);

        mockMvc.perform(post("/api/v1/payments/checkout/bookings/" + reservation.getId())
                        .with(user(owner.getEmail()).roles("OWNER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void bookingCheckoutChargesFirstMonthPlusDeposit() throws Exception {
        Reservation reservation = saveReservation(ReservationStatus.CONFIRMED);

        mockMvc.perform(post("/api/v1/payments/checkout/bookings/" + reservation.getId()).with(asTenant()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.checkoutUrl").value(org.hamcrest.Matchers.startsWith("https://mp.test/checkout/")))
                .andExpect(jsonPath("$.data.amount").value(750.0))
                .andExpect(jsonPath("$.data.currency").value("PEN"));

        ArgumentCaptor<PreferenceRequest> captor = ArgumentCaptor.forClass(PreferenceRequest.class);
        verify(mercadoPago).createPreference(captor.capture(), anyString());
        PreferenceRequest sent = captor.getValue();
        assertThat(sent.externalReference()).isEqualTo("BOOKING-" + reservation.getId());
        assertThat(sent.items()).singleElement().satisfies(item -> {
            assertThat(item.unitPrice()).isEqualByComparingTo("750.00");
            assertThat(item.currencyId()).isEqualTo("PEN");
            assertThat(item.quantity()).isEqualTo(1);
        });
        assertThat(sent.autoReturn()).isEqualTo("approved");
        assertThat(sent.backUrls().success()).isEqualTo("https://roomix.test/?pago=resultado");
        assertThat(sent.notificationUrl()).isEqualTo("https://roomix.test/api/v1/payments/mercadopago/webhook");
    }

    // -------------------------------------------------------------- conciliación

    @Test
    void approvedPaymentMarksReservationPaidAndRentsRoomOnlyOnce() throws Exception {
        Reservation reservation = checkedOutReservation();
        String ref = "BOOKING-" + reservation.getId();
        when(mercadoPago.getPayment("1001")).thenReturn(mpPayment(1001L, "approved", ref, "750.00"));

        for (int i = 0; i < 2; i++) { // la vuelta del comprador y un reintento: mismo resultado
            mockMvc.perform(get("/api/v1/payments/mercadopago/confirm").param("paymentId", "1001").with(asTenant()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("COMPLETED"))
                    .andExpect(jsonPath("$.data.providerPaymentId").value("1001"));
        }

        Payment payment = paymentRepository.findByExternalReference(ref).orElseThrow();
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.COMPLETED);
        assertThat(payment.getPaymentMethod()).isEqualTo("yape");
        assertThat(payment.getPaidAt()).isNotNull();
        assertThat(roomRepository.findById(room.getId()).orElseThrow().getStatus()).isEqualTo(RoomStatus.RENTED);
        assertThat(events.stream(PaymentCompletedEvent.class)
                .filter(e -> e.paymentId().equals(payment.getId()))).hasSize(1);
    }

    @Test
    void lateRejectedAttemptDoesNotUndoAnApprovedPayment() throws Exception {
        Reservation reservation = checkedOutReservation();
        String ref = "BOOKING-" + reservation.getId();
        when(mercadoPago.getPayment("2002")).thenReturn(mpPayment(2002L, "approved", ref, "750.00"));
        when(mercadoPago.getPayment("2001")).thenReturn(mpPayment(2001L, "rejected", ref, "750.00"));

        mockMvc.perform(get("/api/v1/payments/mercadopago/confirm").param("paymentId", "2002").with(asTenant()))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));
        signedWebhook("2001").andExpect(status().isOk());

        Payment payment = paymentRepository.findByExternalReference(ref).orElseThrow();
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.COMPLETED);
        assertThat(payment.getProviderPaymentId()).isEqualTo("2002");
    }

    @Test
    void paymentWithDifferentAmountIsNotAccepted() throws Exception {
        Reservation reservation = checkedOutReservation();
        String ref = "BOOKING-" + reservation.getId();
        when(mercadoPago.getPayment("3001")).thenReturn(mpPayment(3001L, "approved", ref, "1.00"));

        mockMvc.perform(get("/api/v1/payments/mercadopago/confirm").param("paymentId", "3001").with(asTenant()))
                .andExpect(jsonPath("$.data.status").value("FAILED"))
                .andExpect(jsonPath("$.data.statusDetail").value("monto_no_coincide"));
        assertThat(roomRepository.findById(room.getId()).orElseThrow().getStatus()).isEqualTo(RoomStatus.AVAILABLE);
    }

    @Test
    void otherUsersCannotReadThePayment() throws Exception {
        Reservation reservation = checkedOutReservation();
        when(mercadoPago.getPayment("4001")).thenReturn(mpPayment(4001L, "pending", "BOOKING-" + reservation.getId(), "750.00"));

        mockMvc.perform(get("/api/v1/payments/mercadopago/confirm").param("paymentId", "4001")
                        .with(user("intruso@roomix.test").roles("TENANT")))
                .andExpect(status().isForbidden());
    }

    // ------------------------------------------------------------------- webhook

    @Test
    void webhookWithInvalidSignatureIsRejectedWithoutQueryingMercadoPago() throws Exception {
        mockMvc.perform(post("/api/v1/payments/mercadopago/webhook")
                        .param("type", "payment").param("data.id", "5001")
                        .header("x-signature", "ts=1700000000,v1=deadbeef")
                        .header("x-request-id", "req-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"payment\",\"data\":{\"id\":\"5001\"}}"))
                .andExpect(status().isUnauthorized());
        verify(mercadoPago, never()).getPayment(anyString());
    }

    @Test
    void webhookWithValidSignatureCompletesThePayment() throws Exception {
        Reservation reservation = checkedOutReservation();
        String ref = "BOOKING-" + reservation.getId();
        when(mercadoPago.getPayment("6001")).thenReturn(mpPayment(6001L, "approved", ref, "750.00"));

        signedWebhook("6001")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("processed"));
        assertThat(paymentRepository.findByExternalReference(ref).orElseThrow().getStatus()).isEqualTo(PaymentStatus.COMPLETED);
    }

    @Test
    void webhookIgnoresNonPaymentTopics() throws Exception {
        mockMvc.perform(post("/api/v1/payments/mercadopago/webhook")
                        .param("topic", "merchant_order").param("id", "777"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ignored"));
        verifyNoInteractions(mercadoPago);
    }

    // --------------------------------------------------------------- publicación

    @Test
    void publicationFeePaymentMarksRoomAsPaid() throws Exception {
        mockMvc.perform(post("/api/v1/payments/checkout/rooms/" + room.getId() + "/publication")
                        .with(user(owner.getEmail()).roles("OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.amount").value(15.0));

        when(mercadoPago.getPayment("7001")).thenReturn(mpPayment(7001L, "approved", "PUBLICATION-" + room.getId(), "15.00"));
        mockMvc.perform(get("/api/v1/payments/mercadopago/confirm").param("paymentId", "7001")
                        .with(user(owner.getEmail()).roles("OWNER")))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));

        Room updated = roomRepository.findById(room.getId()).orElseThrow();
        assertThat(updated.isPublicationFeePaid()).isTrue();
        assertThat(updated.getPaymentReference()).isEqualTo("7001");

        mockMvc.perform(post("/api/v1/payments/checkout/rooms/" + room.getId() + "/publication")
                        .with(user(owner.getEmail()).roles("OWNER")))
                .andExpect(status().isConflict());
    }

    @Test
    void ownerCanListOwnRoomsToPayPublication() throws Exception {
        // Regresión: /rooms/my-rooms no existía y respondía 400 ("my-rooms" no es un Long)
        mockMvc.perform(get("/api/v1/rooms/my-rooms").with(user(owner.getEmail()).roles("OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(room.getId()))
                .andExpect(jsonPath("$.data[0].publicationFeePaid").value(false));

        mockMvc.perform(get("/api/v1/rooms/my-rooms").with(asTenant()))
                .andExpect(status().isForbidden());
    }

    // ------------------------------------------------------------------- helpers

    private org.springframework.test.web.servlet.request.RequestPostProcessor asTenant() {
        return user(tenant.getEmail()).roles("TENANT");
    }

    private Reservation checkedOutReservation() throws Exception {
        Reservation reservation = saveReservation(ReservationStatus.CONFIRMED);
        mockMvc.perform(post("/api/v1/payments/checkout/bookings/" + reservation.getId()).with(asTenant()))
                .andExpect(status().isOk());
        return reservation;
    }

    private org.springframework.test.web.servlet.ResultActions signedWebhook(String paymentId) throws Exception {
        String ts = String.valueOf(System.currentTimeMillis() / 1000);
        String requestId = UUID.randomUUID().toString();
        String v1 = WebhookSignatureValidator.hmacSha256Hex(WEBHOOK_SECRET,
                WebhookSignatureValidator.manifest(paymentId, requestId, ts));
        return mockMvc.perform(post("/api/v1/payments/mercadopago/webhook")
                .param("type", "payment").param("data.id", paymentId)
                .header("x-signature", "ts=" + ts + ",v1=" + v1)
                .header("x-request-id", requestId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"type\":\"payment\",\"action\":\"payment.updated\",\"data\":{\"id\":\"" + paymentId + "\"}}"));
    }

    private static PaymentInfo mpPayment(Long id, String status, String ref, String amount) {
        return new PaymentInfo(id, status, "approved".equals(status) ? "accredited" : "cc_rejected_other_reason",
                ref, new BigDecimal(amount), "PEN", "yape", "digital_wallet",
                "approved".equals(status) ? OffsetDateTime.now() : null, false);
    }

    private User saveUser(String email, UserRole role) {
        return userRepository.save(User.builder()
                .firstName("Test").lastName("User").email(email).password("x")
                .role(roleRepository.findByName(role).orElseThrow()).build());
    }

    private Reservation saveReservation(ReservationStatus status) {
        LocalDate start = LocalDate.now().plusDays(1);
        return reservationRepository.save(Reservation.builder()
                .room(room).tenant(tenant).startDate(start).endDate(start.plusMonths(3)).months(3)
                .totalPrice(new BigDecimal("1650.00")).initialPayment(new BigDecimal("750.00"))
                .status(status).build());
    }
}
