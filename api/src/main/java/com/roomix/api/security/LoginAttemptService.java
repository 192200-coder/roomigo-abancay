package com.roomix.api.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Servicio de Protección Anti-Fuerza Bruta y Detección de Actividad Sospechosa.
 * Limita los intentos fallidos consecutivos de login por IP y correo electrónico.
 */
@Service
@Slf4j
public class LoginAttemptService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCKOUT_MINUTES = 15;

    // Almacena intentos fallidos por clave (IP o email)
    private final Map<String, AttemptData> attemptsCache = new ConcurrentHashMap<>();

    public void loginFailed(String key) {
        if (key == null || key.isBlank()) return;
        
        AttemptData data = attemptsCache.compute(key, (k, v) -> {
            if (v == null || v.isExpired()) {
                return new AttemptData(1, LocalDateTime.now().plusMinutes(LOCKOUT_MINUTES));
            }
            v.increment();
            return v;
        });

        log.warn("[SEGURIDAD AUDITORÍA] Intento de login fallido para la clave: {}. Intentos acumulados: {}", 
                key, data.getAttempts());
        
        if (data.getAttempts() >= MAX_FAILED_ATTEMPTS) {
            log.error("[SEGURIDAD ALERTA] Clave {} bloqueada por {} minutos debido a múltiples intentos fallidos (Anti-Brute Force).",
                    key, LOCKOUT_MINUTES);
        }
    }

    public void loginSucceeded(String key) {
        if (key == null) return;
        attemptsCache.remove(key);
        log.info("[SEGURIDAD AUDITORÍA] Login exitoso para la clave: {}. Contador de intentos reiniciado.", key);
    }

    public boolean isBlocked(String key) {
        if (key == null) return false;
        AttemptData data = attemptsCache.get(key);
        if (data == null) return false;
        
        if (data.isExpired()) {
            attemptsCache.remove(key);
            return false;
        }
        
        return data.getAttempts() >= MAX_FAILED_ATTEMPTS;
    }

    public int getRemainingMinutes(String key) {
        AttemptData data = attemptsCache.get(key);
        if (data == null || data.isExpired()) return 0;
        long seconds = java.time.Duration.between(LocalDateTime.now(), data.getExpiresAt()).getSeconds();
        return (int) Math.max(1, (seconds + 59) / 60);
    }

    private static class AttemptData {
        private int attempts;
        private final LocalDateTime expiresAt;

        public AttemptData(int attempts, LocalDateTime expiresAt) {
            this.attempts = attempts;
            this.expiresAt = expiresAt;
        }

        public void increment() {
            this.attempts++;
        }

        public int getAttempts() {
            return attempts;
        }

        public LocalDateTime getExpiresAt() {
            return expiresAt;
        }

        public boolean isExpired() {
            return LocalDateTime.now().isAfter(expiresAt);
        }
    }
}
