package com.roomix.api;

import com.roomix.api.dto.request.RegisterRequestDto;
import com.roomix.api.entity.enums.UserRole;
import com.roomix.api.service.AuthService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@EnabledIfEnvironmentVariable(named = "ROOMIX_TEST_LOCAL_POSTGRES", matches = "true")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:postgresql://127.0.0.1:5432/roomix_db",
    "spring.datasource.driver-class-name=org.postgresql.Driver",
    "spring.datasource.username=postgres",
    "spring.datasource.password=${ROOMIX_TEST_DB_PASSWORD}",
    "spring.jpa.hibernate.ddl-auto=validate",
    "app.jwt.secret=${ROOMIX_TEST_JWT_SECRET}"
})
class LocalPostgresRegistrationTest {
    @Autowired private AuthService authService;
    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @Test
    @Transactional
    void registerWithRollback() {
        var request = RegisterRequestDto.builder().firstName("Prueba").lastName("Diagnostico")
                .email("diagnostico." + UUID.randomUUID() + "@example.invalid")
                .password("PruebaSegura123!").role(UserRole.ROLE_TENANT).build();
        assertNotNull(authService.register(request).getAccessToken());
    }

    @Test
    @Transactional
    void registerThroughHttpWithRollback() throws Exception {
        var request = RegisterRequestDto.builder().firstName("Prueba").lastName("Diagnostico")
                .email("diagnostico." + UUID.randomUUID() + "@example.invalid")
                .password("PruebaSegura123!").role(UserRole.ROLE_TENANT).build();
        mockMvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.accessToken").isNotEmpty());
    }
}
