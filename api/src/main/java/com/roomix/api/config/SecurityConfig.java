package com.roomix.api.config;

import com.roomix.api.security.JwtAuthenticationFilter;
import com.roomix.api.security.JwtEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final JwtEntryPoint jwtEntryPoint;
    private final AuthenticationProvider authenticationProvider;
    private final com.roomix.api.security.RateLimitingFilter rateLimitingFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .headers(headers -> headers
                        .frameOptions(frame -> frame.deny()) // Previene Clickjacking
                        .contentTypeOptions(org.springframework.security.config.Customizer.withDefaults()) // X-Content-Type-Options: nosniff
                        .xssProtection(xss -> xss.headerValue(org.springframework.security.web.header.writers.XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK))
                        .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https: data:; frame-ancestors 'none'; connect-src 'self' http://localhost:8081 http://localhost:4200 https:;"))
                        .referrerPolicy(referrer -> referrer.policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                        .permissionsPolicy(permissions -> permissions.policy("geolocation=(), camera=(), microphone=()"))
                )
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .exceptionHandling(exception -> exception.authenticationEntryPoint(jwtEntryPoint))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Endpoints Públicos
                        .requestMatchers("/", "/health", "/favicon.ico", "/actuator/**").permitAll()
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/rooms", "/api/v1/rooms/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/properties", "/api/v1/properties/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/reviews", "/api/v1/reviews/**").permitAll()
                        .requestMatchers("/api/v1/payments/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        // Swagger UI & OpenAPI Docs
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/api-docs", "/api-docs/**", "/v3/api-docs", "/v3/api-docs/**").permitAll()
                        // H2 Console
                        .requestMatchers("/h2-console/**").permitAll()
                        // Endpoints Protegidos por Rol
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/v1/owner/**").hasAnyRole("OWNER", "ADMIN")
                        .requestMatchers("/api/v1/tenant/**").hasAnyRole("TENANT", "ADMIN")
                        // Cualquier otra solicitud requiere autenticación
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(
                "http://localhost:[*]",
                "http://127.0.0.1:[*]",
                "https://*.vercel.app",
                "https://*.roomigo.pe"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
