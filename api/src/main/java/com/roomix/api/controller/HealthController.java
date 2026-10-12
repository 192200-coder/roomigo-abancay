package com.roomix.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@Tag(name = "Health & Root", description = "Endpoints de verificación de estado y bienvenida")
public class HealthController {

    @Operation(summary = "Root API Endpoint")
    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "app", "RoomiGo Backend API",
                "version", "1.0.0",
                "docs", "/swagger-ui/index.html",
                "timestamp", Instant.now().toString()
        ));
    }

    @Operation(summary = "Health Check Endpoint")
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "timestamp", Instant.now().toString()
        ));
    }
}
