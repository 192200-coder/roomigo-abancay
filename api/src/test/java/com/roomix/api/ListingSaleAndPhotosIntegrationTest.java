package com.roomix.api;

import com.roomix.api.entity.*;
import com.roomix.api.entity.enums.*;
import com.roomix.api.payment.MercadoPagoClient;
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
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Fase 5: publicaciones en venta, tipos orientados al público, fotos obligatorias
 * (fachada + habitación + baño) y pedidos de visita.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:roomix-listings;MODE=PostgreSQL;DB_CLOSE_DELAY=-1")
class ListingSaleAndPhotosIntegrationTest {

    private static final String PHOTOS = """
            [{"url":"https://fotos.test/fachada.jpg","category":"FACADE"},
             {"url":"https://fotos.test/dormitorio.jpg","category":"ROOM"},
             {"url":"https://fotos.test/bano.jpg","category":"BATHROOM"},
             {"url":"https://fotos.test/cocina.jpg","category":"LIVING_KITCHEN"}]""";

    @Autowired private MockMvc mockMvc;
    @Autowired private RoleRepository roleRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PropertyRepository propertyRepository;
    @Autowired private RoomRepository roomRepository;
    @Autowired private NotificationRepository notificationRepository;

    @MockitoBean private MercadoPagoClient mercadoPago;

    private User owner;
    private User otherOwner;
    private User tenant;
    private Property property;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        owner = saveUser("Olga", "owner-" + suffix + "@roomix.test", UserRole.ROLE_OWNER, "+51 987 654 321");
        otherOwner = saveUser("Omar", "other-" + suffix + "@roomix.test", UserRole.ROLE_OWNER, null);
        tenant = saveUser("Tito", "tenant-" + suffix + "@roomix.test", UserRole.ROLE_TENANT, null);
        property = propertyRepository.save(Property.builder()
                .owner(owner).title("Casa " + suffix).address("Jr. Lima 120").city("Abancay").build());
    }

    // ------------------------------------------------------------------ fotos obligatorias

    @Test
    void publishingRequiresFacadeRoomAndBathroomPhotos() throws Exception {
        String noPhotos = rentBody("ROOM", null);
        mockMvc.perform(post("/api/v1/rooms").with(as(owner, "OWNER")).contentType(MediaType.APPLICATION_JSON).content(noPhotos))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("fachada, la habitación y el baño")));

        String withoutBathroom = rentBody("ROOM", """
                [{"url":"https://fotos.test/a.jpg","category":"FACADE"},{"url":"https://fotos.test/b.jpg","category":"ROOM"}]""");
        mockMvc.perform(post("/api/v1/rooms").with(as(owner, "OWNER")).contentType(MediaType.APPLICATION_JSON).content(withoutBathroom))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Faltan fotos obligatorias: baño"));

        String tooMany = rentBody("ROOM", "[" + String.join(",", java.util.Collections.nCopies(9,
                "{\"url\":\"https://fotos.test/x.jpg\",\"category\":\"FACADE\"}")) + "]");
        mockMvc.perform(post("/api/v1/rooms").with(as(owner, "OWNER")).contentType(MediaType.APPLICATION_JSON).content(tooMany))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Puedes subir como máximo 8 fotos"));

        String badFormat = rentBody("ROOM", """
                [{"url":"javascript:alert(1)","category":"FACADE"},{"url":"https://fotos.test/b.jpg","category":"ROOM"},
                 {"url":"https://fotos.test/c.jpg","category":"BATHROOM"}]""");
        mockMvc.perform(post("/api/v1/rooms").with(as(owner, "OWNER")).contentType(MediaType.APPLICATION_JSON).content(badFormat))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Formato de foto no válido"));
    }

    @Test
    void detailReturnsTheCategorizedGalleryButListingsDoNot() throws Exception {
        String created = mockMvc.perform(post("/api/v1/rooms").with(as(owner, "OWNER"))
                        .contentType(MediaType.APPLICATION_JSON).content(rentBody("MINI_APARTMENT", PHOTOS)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.operation").value("RENT"))
                .andExpect(jsonPath("$.data.roomType").value("MINI_APARTMENT"))
                .andExpect(jsonPath("$.data.mainImageUrl").value("https://fotos.test/fachada.jpg"))
                .andExpect(jsonPath("$.data.photos").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        long id = idOf(created);

        mockMvc.perform(get("/api/v1/rooms/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.photos.length()").value(4))
                .andExpect(jsonPath("$.data.photos[0].category").value("FACADE"))
                .andExpect(jsonPath("$.data.photos[2].category").value("BATHROOM"));
    }

    @Test
    void editingWithoutPhotosKeepsLegacyGalleryButNewPhotosMustBeComplete() throws Exception {
        // Publicación antigua: sin fotos categorizadas
        Room legacy = roomRepository.save(Room.builder().property(property).title("Cuarto antiguo")
                .pricePerMonth(new BigDecimal("300")).depositPrice(new BigDecimal("100"))
                .roomType(RoomType.ROOM).status(RoomStatus.AVAILABLE).build());

        mockMvc.perform(put("/api/v1/rooms/" + legacy.getId()).with(as(owner, "OWNER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Cuarto antiguo renovado\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Cuarto antiguo renovado"));

        mockMvc.perform(put("/api/v1/rooms/" + legacy.getId()).with(as(owner, "OWNER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"photos\":[{\"url\":\"https://fotos.test/a.jpg\",\"category\":\"ROOM\"}]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("fachada")));
    }

    // ------------------------------------------------------------------ venta

    @Test
    void houseForSaleStoresSaleDataAndClearsRent() throws Exception {
        String body = """
                {"propertyId":%d,"title":"Casa de 2 pisos en Villa Ampay","operation":"SALE","roomType":"HOUSE",
                 "salePrice":285000,"pricePerMonth":999,"depositPrice":999,
                 "bedrooms":4,"bathrooms":2,"sizeSqm":160,"landAreaSqm":200,"capacity":6,"photos":%s}"""
                .formatted(property.getId(), PHOTOS);
        String created = mockMvc.perform(post("/api/v1/rooms").with(as(owner, "OWNER"))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.operation").value("SALE"))
                .andExpect(jsonPath("$.data.salePrice").value(285000))
                .andExpect(jsonPath("$.data.pricePerMonth").doesNotExist())
                .andExpect(jsonPath("$.data.depositPrice").doesNotExist())
                .andExpect(jsonPath("$.data.bedrooms").value(4))
                .andExpect(jsonPath("$.data.landAreaSqm").value(200.0))
                .andReturn().getResponse().getContentAsString();
        Room room = roomRepository.findById(idOf(created)).orElseThrow();
        assertThat(room.getPricePerMonth()).isNull();
    }

    @Test
    void saleAndRentRulesAreEnforced() throws Exception {
        String roomForSale = """
                {"propertyId":%d,"title":"Cuarto","operation":"SALE","roomType":"ROOM","salePrice":40000,"photos":%s}"""
                .formatted(property.getId(), PHOTOS);
        mockMvc.perform(post("/api/v1/rooms").with(as(owner, "OWNER")).contentType(MediaType.APPLICATION_JSON).content(roomForSale))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("solo puede publicarse en alquiler")));

        String saleWithoutPrice = """
                {"propertyId":%d,"title":"Casa","operation":"SALE","roomType":"HOUSE","photos":%s}"""
                .formatted(property.getId(), PHOTOS);
        mockMvc.perform(post("/api/v1/rooms").with(as(owner, "OWNER")).contentType(MediaType.APPLICATION_JSON).content(saleWithoutPrice))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Indica el precio de venta"));

        String rentWithoutPrice = """
                {"propertyId":%d,"title":"Cuarto","roomType":"ROOM","depositPrice":100,"photos":%s}"""
                .formatted(property.getId(), PHOTOS);
        mockMvc.perform(post("/api/v1/rooms").with(as(owner, "OWNER")).contentType(MediaType.APPLICATION_JSON).content(rentWithoutPrice))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Indica la renta mensual"));
    }

    @Test
    void listingsForSaleCannotBeBookedAndCatalogFiltersByOperation() throws Exception {
        Room sale = saleRoom("Casa en venta · Tamburco", "180000");
        Room rent = roomRepository.save(Room.builder().property(property).title("Cuarto en alquiler")
                .pricePerMonth(new BigDecimal("350")).depositPrice(new BigDecimal("150"))
                .roomType(RoomType.ROOM).status(RoomStatus.AVAILABLE).build());

        String booking = "{\"roomId\":" + sale.getId() + ",\"startDate\":\"" + LocalDate.now().plusDays(3) + "\",\"months\":2}";
        mockMvc.perform(post("/api/v1/bookings").with(as(tenant, "TENANT")).contentType(MediaType.APPLICATION_JSON).content(booking))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Agenda una visita")));

        // En ventas, el rango de precio se aplica al precio de venta
        mockMvc.perform(get("/api/v1/rooms/search").param("operation", "SALE").param("minPrice", "100000").param("size", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.id == " + sale.getId() + ")]").exists())
                .andExpect(jsonPath("$.data.content[?(@.id == " + rent.getId() + ")]").doesNotExist())
                .andExpect(jsonPath("$.data.content[?(@.operation == 'RENT')]").doesNotExist());

        mockMvc.perform(get("/api/v1/rooms/search").param("operation", "RENT").param("roomType", "ROOM").param("size", "50"))
                .andExpect(jsonPath("$.data.content[?(@.id == " + rent.getId() + ")]").exists())
                .andExpect(jsonPath("$.data.content[?(@.operation == 'SALE')]").doesNotExist());
    }

    // ------------------------------------------------------------------ visitas

    @Test
    void visitRequestFlowNotifiesBothSidesAndRevealsPhoneOnlyWhenConfirmed() throws Exception {
        Room sale = saleRoom("Casa con huerto · Villa Ampay", "250000");
        String body = """
                {"roomId":%d,"preferredDate":"%s","preferredTime":"10:30","contactPhone":"+51 900 111 222",
                 "message":"Me interesa, ¿se puede ver el sábado?"}""".formatted(sale.getId(), LocalDate.now().plusDays(4));

        String created = mockMvc.perform(post("/api/v1/visit-requests").with(as(tenant, "TENANT"))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.ownerPhone").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        long visitId = idOf(created);
        assertThat(latest(owner).getType()).isEqualTo("VISIT_REQUESTED");
        assertThat(latest(owner).getMessage()).contains("Tito").contains("10:30");

        // Un solo pedido abierto por publicación
        mockMvc.perform(post("/api/v1/visit-requests").with(as(tenant, "TENANT"))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());

        // El propietario ve el contacto del interesado
        mockMvc.perform(get("/api/v1/visit-requests/owner").with(as(owner, "OWNER")))
                .andExpect(jsonPath("$.data[0].contactPhone").value("+51 900 111 222"))
                .andExpect(jsonPath("$.data[0].message").value("Me interesa, ¿se puede ver el sábado?"));

        // Otro usuario no puede responder
        mockMvc.perform(patch("/api/v1/visit-requests/" + visitId + "/status").with(as(otherOwner, "OWNER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"CONFIRMED\"}"))
                .andExpect(status().isUnauthorized());
        // El interesado no puede confirmar su propio pedido
        mockMvc.perform(patch("/api/v1/visit-requests/" + visitId + "/status").with(as(tenant, "TENANT"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"CONFIRMED\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(patch("/api/v1/visit-requests/" + visitId + "/status").with(as(owner, "OWNER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"CONFIRMED\",\"note\":\"Toque el timbre del 2.º piso\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"));
        assertThat(latest(tenant).getType()).isEqualTo("VISIT_CONFIRMED");
        assertThat(latest(tenant).getMessage()).contains("Toque el timbre");

        mockMvc.perform(get("/api/v1/visit-requests/mine").with(as(tenant, "TENANT")))
                .andExpect(jsonPath("$.data[0].status").value("CONFIRMED"))
                .andExpect(jsonPath("$.data[0].ownerPhone").value("+51 987 654 321"));

        // El interesado cancela -> se avisa al propietario
        mockMvc.perform(patch("/api/v1/visit-requests/" + visitId + "/status").with(as(tenant, "TENANT"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"CANCELLED\"}"))
                .andExpect(status().isOk());
        assertThat(latest(owner).getType()).isEqualTo("VISIT_CANCELLED");
    }

    @Test
    void visitsAreOnlyForAvailableSaleListingsOfOtherUsers() throws Exception {
        Room rent = roomRepository.save(Room.builder().property(property).title("Cuarto")
                .pricePerMonth(new BigDecimal("350")).depositPrice(new BigDecimal("150"))
                .roomType(RoomType.ROOM).status(RoomStatus.AVAILABLE).build());
        Room sale = saleRoom("Departamento en venta", "150000");
        String date = LocalDate.now().plusDays(2).toString();

        mockMvc.perform(post("/api/v1/visit-requests").with(as(tenant, "TENANT")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"roomId\":" + rent.getId() + ",\"preferredDate\":\"" + date + "\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/visit-requests").with(as(owner, "OWNER")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"roomId\":" + sale.getId() + ",\"preferredDate\":\"" + date + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("No puedes agendar una visita a tu propia publicación"));
        mockMvc.perform(post("/api/v1/visit-requests").with(as(tenant, "TENANT")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"roomId\":" + sale.getId() + ",\"preferredDate\":\"" + LocalDate.now().minusDays(1) + "\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/visit-requests").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"roomId\":" + sale.getId() + ",\"preferredDate\":\"" + date + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    // ------------------------------------------------------------------ permisos

    @Test
    void ownersCannotEditOrDeleteListingsOfOthers() throws Exception {
        Room sale = saleRoom("Casa ajena", "200000");
        mockMvc.perform(put("/api/v1/rooms/" + sale.getId()).with(as(otherOwner, "OWNER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Hackeado\"}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/v1/rooms/" + sale.getId()).with(as(otherOwner, "OWNER")))
                .andExpect(status().isUnauthorized());
        assertThat(roomRepository.findById(sale.getId()).orElseThrow().getTitle()).isEqualTo("Casa ajena");

        mockMvc.perform(delete("/api/v1/rooms/" + sale.getId()).with(as(owner, "OWNER")))
                .andExpect(status().isOk());
        assertThat(roomRepository.findById(sale.getId())).isEmpty();
    }

    // ------------------------------------------------------------------ helpers

    private String rentBody(String type, String photosJson) {
        return """
                {"propertyId":%d,"title":"Publicación de prueba","roomType":"%s","pricePerMonth":400,"depositPrice":200%s}"""
                .formatted(property.getId(), type, photosJson == null ? "" : ",\"photos\":" + photosJson);
    }

    private Room saleRoom(String title, String price) {
        return roomRepository.save(Room.builder().property(property).title(title)
                .operation(ListingOperation.SALE).salePrice(new BigDecimal(price))
                .roomType(RoomType.HOUSE).bedrooms(3).bathrooms(2)
                .status(RoomStatus.AVAILABLE).build());
    }

    private static long idOf(String json) {
        return Long.parseLong(json.replaceAll(".*\"data\":\\{\"id\":(\\d+).*", "$1"));
    }

    private static RequestPostProcessor as(User u, String role) {
        return user(u.getEmail()).roles(role);
    }

    private Notification latest(User u) {
        return notificationRepository.findByUserIdOrderByCreatedAtDescIdDesc(u.getId(), org.springframework.data.domain.PageRequest.of(0, 1))
                .getContent().getFirst();
    }

    private User saveUser(String name, String email, UserRole role, String phone) {
        return userRepository.save(User.builder().firstName(name).lastName("Test").email(email).password("x").phone(phone)
                .role(roleRepository.findByName(role).orElseThrow()).build());
    }
}
