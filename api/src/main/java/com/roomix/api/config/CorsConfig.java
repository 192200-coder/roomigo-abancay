package com.roomix.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 1. Dominios permitidos (Vercel producción, previsualizaciones y entornos de desarrollo)
        configuration.setAllowedOriginPatterns(List.of(
            "https://roomi-go-abancay-rpjl.vercel.app",
            "https://*.vercel.app",
            "http://localhost:4200",
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:*",
            "http://127.0.0.1:*"
        ));

        // 2. Métodos HTTP permitidos
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"));

        // 3. Encabezados permitidos
        configuration.setAllowedHeaders(List.of(
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers"
        ));

        // 4. Permitir credenciales / cookies / headers de autorización
        configuration.setAllowCredentials(true);

        // 5. Exponer headers si es necesario
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
