package com.roomix.api;

import tools.jackson.databind.ObjectMapper;
import com.roomix.api.dto.request.*;
import com.roomix.api.entity.enums.RoomType;
import com.roomix.api.entity.enums.UserRole;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:roomix;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.jwt.secret=VGhpc0lzQVN0cm9uZ1Rlc3RTZWNyZXRGb3JKV1QxMjM0NTY3OA=="
})
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class RoomixIntegrationTest {

    static {
        System.setProperty("java.net.preferIPv4Stack", "false");
        System.setProperty("java.net.preferIPv6Addresses", "true");
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String OWNER_EMAIL = "carlos.owner." + System.currentTimeMillis() + "@test.com";
    private static final String TENANT_EMAIL = "ana.tenant." + System.currentTimeMillis() + "@test.com";

    private static String ownerToken;
    private static String tenantToken;
    private static Long propertyId;
    private static Long roomId;
    private static Long bookingId;

    @Test
    void shouldRejectUnconfiguredSocialVerification() throws Exception {
        String payload = "{\"email\":\"test@example.com\",\"code\":\"123456\",\"provider\":\"GOOGLE\"}";
        mockMvc.perform(post("/api/v1/auth/social/verify").contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El acceso social no está disponible. Usa correo y contraseña."));
    }

    @Test
    void shouldRegisterWithoutOptionalPhoneAndRejectDuplicate() throws Exception {
        RegisterRequestDto request = RegisterRequestDto.builder()
                .firstName("Maria")
                .lastName("Inquilina")
                .email("registro." + java.util.UUID.randomUUID() + "@test.com")
                .password("Password123!")
                .role(UserRole.ROLE_TENANT)
                .build();

        String payload = objectMapper.writeValueAsString(request);
        mockMvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty());
        mockMvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(LoginRequestDto.builder()
                                .email(request.getEmail()).password(request.getPassword()).build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty());
    }

    @Test
    void shouldRejectPublicAdminRegistration() throws Exception {
        RegisterRequestDto request = RegisterRequestDto.builder()
                .firstName("Maria").lastName("Prueba")
                .email("admin." + java.util.UUID.randomUUID() + "@test.com")
                .password("Password123!").role(UserRole.ROLE_ADMIN).build();
        mockMvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(1)
    void shouldRegisterAndLoginOwner() throws Exception {
        RegisterRequestDto ownerRegister = RegisterRequestDto.builder()
                .firstName("Carlos")
                .lastName("Propietario")
                .email(OWNER_EMAIL)
                .password("Password123!")
                .phone("+51987654321")
                .role(UserRole.ROLE_OWNER)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ownerRegister)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty());

        LoginRequestDto ownerLogin = LoginRequestDto.builder()
                .email(OWNER_EMAIL)
                .password("Password123!")
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ownerLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andReturn();

        String responseJson = result.getResponse().getContentAsString();
        ownerToken = objectMapper.readTree(responseJson).path("data").path("accessToken").asText();
    }

    @Test
    @Order(2)
    void shouldRegisterAndLoginTenant() throws Exception {
        RegisterRequestDto tenantRegister = RegisterRequestDto.builder()
                .firstName("Ana")
                .lastName("Inquilina")
                .email(TENANT_EMAIL)
                .password("Password123!")
                .phone("+51912345678")
                .role(UserRole.ROLE_TENANT)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(tenantRegister)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty());

        LoginRequestDto tenantLogin = LoginRequestDto.builder()
                .email(TENANT_EMAIL)
                .password("Password123!")
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(tenantLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andReturn();

        String responseJson = result.getResponse().getContentAsString();
        tenantToken = objectMapper.readTree(responseJson).path("data").path("accessToken").asText();
    }

    @Test
    @Order(3)
    void shouldCreatePropertyAsOwner() throws Exception {
        PropertyRequestDto propertyRequest = PropertyRequestDto.builder()
                .title("Casa Residencial Miraflores")
                .description("Hermosa casa con cuartos para estudiantes y profesionales")
                .address("Av. Larco 1234")
                .city("Lima")
                .country("Perú")
                .latitude(-12.1215)
                .longitude(-77.0298)
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/properties")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(propertyRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").isNotEmpty())
                .andExpect(jsonPath("$.data.title").value("Casa Residencial Miraflores"))
                .andReturn();

        String responseJson = result.getResponse().getContentAsString();
        propertyId = objectMapper.readTree(responseJson).path("data").path("id").asLong();
    }

    @Test
    @Order(4)
    void shouldCreateRoomAsOwner() throws Exception {
        RoomRequestDto roomRequest = RoomRequestDto.builder()
                .propertyId(propertyId)
                .title("Habitación luminosa con baño privado")
                .description("Habitación amplia con escritorio, cama doble y clóset empotrado")
                .pricePerMonth(BigDecimal.valueOf(850.00))
                .depositPrice(BigDecimal.valueOf(850.00))
                .roomType(RoomType.SINGLE)
                .privateBathroom(true)
                .capacity(1)
                .sizeSqm(18.5)
                .offersWifi(true)
                .acceptsPets(false)
                .paymentMethod("MERCADO_PAGO")
                .paymentReference("referencia-no-verificada")
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/rooms")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roomRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").isNotEmpty())
                .andExpect(jsonPath("$.data.status").value("PENDING_APPROVAL"))
                .andExpect(jsonPath("$.data.publicationFeePaid").value(false))
                .andReturn();

        String responseJson = result.getResponse().getContentAsString();
        roomId = objectMapper.readTree(responseJson).path("data").path("id").asLong();

        // Iniciar sesión como Administrador del sistema para aprobar la habitación
        LoginRequestDto adminLogin = LoginRequestDto.builder()
                .email("admin@roomix.com")
                .password("Admin123!")
                .build();

        MvcResult adminLoginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        String adminToken = objectMapper.readTree(adminLoginResult.getResponse().getContentAsString()).path("data").path("accessToken").asText();

        // Aprobar la publicación para dejarla en estado AVAILABLE
        mockMvc.perform(patch("/api/v1/admin/rooms/" + roomId + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("AVAILABLE"))
                .andExpect(jsonPath("$.data.publicationFeePaid").value(false));
    }

    @Test
    @Order(5)
    void shouldSearchRoomsPublicly() throws Exception {
        mockMvc.perform(get("/api/v1/rooms/search")
                        .param("city", "Lima")
                        .param("minPrice", "500")
                        .param("maxPrice", "1000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    @Test
    @Order(6)
    void shouldCreateBookingAsTenant() throws Exception {
        BookingRequestDto bookingRequest = BookingRequestDto.builder()
                .roomId(roomId)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(31))
                .notes("Estudiante universitario, estancia tranquila")
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/bookings")
                        .header("Authorization", "Bearer " + tenantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookingRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").isNotEmpty())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andReturn();

        String responseJson = result.getResponse().getContentAsString();
        bookingId = objectMapper.readTree(responseJson).path("data").path("id").asLong();
    }

    @Test
    @Order(7)
    void shouldConfirmBookingAsOwner() throws Exception {
        mockMvc.perform(patch("/api/v1/bookings/" + bookingId + "/status")
                        .header("Authorization", "Bearer " + ownerToken)
                        .param("status", "CONFIRMED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"));
    }

    @Test
    @Order(8)
    void shouldCreateReviewAsTenant() throws Exception {
        ReviewRequestDto reviewRequest = ReviewRequestDto.builder()
                .bookingId(bookingId)
                .rating(5)
                .comment("Excelente habitación, muy cómoda y todo limpio.")
                .build();

        mockMvc.perform(post("/api/v1/reviews")
                        .header("Authorization", "Bearer " + tenantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.rating").value(5))
                .andExpect(jsonPath("$.data.roomId").value(roomId));
    }

    @Test
    @Order(9)
    void shouldGetReviewsForRoom() throws Exception {
        mockMvc.perform(get("/api/v1/reviews/room/" + roomId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].rating").value(5));
    }
}
