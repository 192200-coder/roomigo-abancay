package com.roomix.api.security;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Utilidad de Sanitización y Validación contra Inyección y Cross-Site Scripting (XSS).
 * Limpia tags HTML peligrosos, scripts ejecutables y eventos on* de texto ingresado por usuarios.
 */
@Component
public class InputSanitizer {

    private static final Pattern SCRIPT_TAG_PATTERN = Pattern.compile("(?i)<script.*?>.*?</script.*?>", Pattern.DOTALL);
    private static final Pattern HTML_TAGS_PATTERN = Pattern.compile("<[^>]*>");
    private static final Pattern JAVASCRIPT_PSEUDO = Pattern.compile("(?i)javascript:", Pattern.CASE_INSENSITIVE);
    private static final Pattern EVENT_HANDLERS = Pattern.compile("(?i)\\bon\\w+\\s*=", Pattern.CASE_INSENSITIVE);

    /**
     * Sanitiza texto plano eliminando cualquier tag o contenido ejecutable.
     */
    public String sanitizeText(String input) {
        if (input == null) return null;
        String clean = SCRIPT_TAG_PATTERN.matcher(input).replaceAll("");
        clean = JAVASCRIPT_PSEUDO.matcher(clean).replaceAll("");
        clean = EVENT_HANDLERS.matcher(clean).replaceAll("");
        clean = HTML_TAGS_PATTERN.matcher(clean).replaceAll("");
        return clean.trim();
    }

    /**
     * Valida que un número de teléfono sea seguro y tenga formato válido para Perú (+51 o 9 dígitos).
     */
    public boolean isValidPhone(String phone) {
        if (phone == null || phone.isBlank()) return true; // Opcional
        return phone.matches("^(?:\\+51\\s?)?9\\d{2}\\s?\\d{3}\\s?\\d{3}$");
    }
}
