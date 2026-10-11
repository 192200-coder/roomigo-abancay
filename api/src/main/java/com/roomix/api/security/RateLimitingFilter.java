package com.roomix.api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Filtro de Protección de Servidor y APIs: Rate Limiting por IP.
 * Previene ataques DDoS, spam de endpoints de registro/login y scraping masivo.
 */
@Component
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int GENERAL_LIMIT_PER_MINUTE = 150;
    private static final int AUTH_LIMIT_PER_MINUTE = 20;
    private static final int OTP_LIMIT_PER_MINUTE = 6;

    private final Map<String, RequestCounter> requestCounts = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // No limitar pre-flight OPTIONS ni recursos de documentación Swagger
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        if (path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs") || path.startsWith("/api-docs")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);
        int maxAllowed = GENERAL_LIMIT_PER_MINUTE;

        if (path.contains("/auth/social/send-code")) {
            maxAllowed = OTP_LIMIT_PER_MINUTE;
        } else if (path.startsWith("/api/v1/auth/")) {
            maxAllowed = AUTH_LIMIT_PER_MINUTE;
        }

        String key = clientIp + ":" + (path.startsWith("/api/v1/auth/") ? "auth" : "gen");
        long currentMinute = System.currentTimeMillis() / 60000;

        RequestCounter counter = requestCounts.compute(key, (k, v) -> {
            if (v == null || v.minuteWindow != currentMinute) {
                return new RequestCounter(currentMinute, 1);
            }
            v.count++;
            return v;
        });

        // Limpieza periódica suave de ventanas anteriores
        if (requestCounts.size() > 5000) {
            requestCounts.entrySet().removeIf(e -> e.getValue().minuteWindow < currentMinute - 1);
        }

        if (counter.count > maxAllowed) {
            log.warn("[RATE LIMIT EXCEEDED] IP {} excedió límite de peticiones ({}/{}) en {}", 
                    clientIp, counter.count, maxAllowed, path);
            
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", "60");
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"success\":false,\"message\":\"Límite de peticiones excedido. Por seguridad, espere un minuto antes de reintentar.\",\"code\":429}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isBlank()) {
            return xfHeader.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }

    private static class RequestCounter {
        final long minuteWindow;
        int count;

        RequestCounter(long minuteWindow, int count) {
            this.minuteWindow = minuteWindow;
            this.count = count;
        }
    }
}
