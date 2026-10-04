package com.roomix.api.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:codearcadia.roomix@gmail.com}")
    private String fromEmail;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    public boolean sendVerificationCode(String toEmail, String code, String provider, String fullName) {
        String displayName = (fullName != null && !fullName.trim().isEmpty()) ? fullName.trim() : "Usuario";
        String providerName = (provider != null && provider.equalsIgnoreCase("FACEBOOK")) ? "Facebook" : "Google";

        log.info("==================================================================");
        log.info("[ROOMIX EMAIL SERVICE] CÓDIGO DE VERIFICACIÓN GENERADO");
        log.info("Destinatario: {}", toEmail);
        log.info("Proveedor:    {}", providerName);
        log.info("Código OTP:   {}", code);
        log.info("==================================================================");

        if (mailSender == null || mailPassword == null || mailPassword.trim().isEmpty()) {
            log.info("[EMAIL SERVICE] Credenciales SMTP no configuradas. Código registrado exitosamente para verificación.");
            return true;
        }

        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                helper.setFrom(fromEmail, "Roomix Abancay - Code Arcadia");
                helper.setTo(toEmail);
                helper.setSubject(code + " es tu código de verificación de Roomix Abancay");

                String htmlContent = buildHtmlEmailTemplate(displayName, code, providerName);
                helper.setText(htmlContent, true);

                mailSender.send(message);
                log.info("[EMAIL SERVICE] ¡Correo de verificación enviado exitosamente a {}!", toEmail);
            } catch (Exception ex) {
                log.warn("[EMAIL SERVICE] No se pudo enviar el correo vía SMTP ({}: {}). El código {} sigue activo en el sistema.",
                        ex.getClass().getSimpleName(), ex.getMessage(), code);
            }
        });

        return true;
    }

    private String buildHtmlEmailTemplate(String displayName, String code, String providerName) {
        return "<!DOCTYPE html>"
                + "<html>"
                + "<head><meta charset='UTF-8'></head>"
                + "<body style='margin:0;padding:0;background-color:#0f172a;font-family:Arial,Helvetica,sans-serif;color:#f8fafc;'>"
                + "  <table width='100%' cellpadding='0' cellspacing='0' style='background-color:#0f172a;padding:40px 10px;'>"
                + "    <tr>"
                + "      <td align='center'>"
                + "        <table width='540' cellpadding='0' cellspacing='0' style='background-color:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.5);'>"
                + "          <tr>"
                + "            <td style='background:linear-gradient(135deg,#2563eb,#4f46e5);padding:30px 40px;text-align:center;'>"
                + "              <h1 style='margin:0;font-size:24px;color:#ffffff;letter-spacing:1px;'>CODE ARCADIA</h1>"
                + "              <p style='margin:6px 0 0 0;font-size:13px;color:#cbd5e1;text-transform:uppercase;letter-spacing:1.5px;'>Roomix Abancay • Plataforma Inmobiliaria</p>"
                + "            </td>"
                + "          </tr>"
                + "          <tr>"
                + "            <td style='padding:35px 40px;'>"
                + "              <h2 style='margin:0 0 15px 0;font-size:20px;color:#ffffff;'>¡Hola, " + displayName + "!</h2>"
                + "              <p style='margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#94a3b8;'>"
                + "                Has solicitado autenticar tu cuenta mediante <strong>" + providerName + "</strong> en la plataforma Roomix de Abancay, Apurímac."
                + "              </p>"
                + "              <p style='margin:0 0 10px 0;font-size:14px;color:#cbd5e1;'>Ingresa este código de seguridad de 6 dígitos para completar tu acceso:</p>"
                + "              <div style='background-color:#0f172a;border:2px dashed #4f46e5;border-radius:12px;padding:18px;margin:20px 0;text-align:center;'>"
                + "                <span style='font-size:36px;font-weight:bold;letter-spacing:10px;color:#38bdf8;font-family:Courier New,monospace;'>" + code + "</span>"
                + "              </div>"
                + "              <p style='margin:0 0 10px 0;font-size:13px;color:#e2e8f0;background-color:#334155;padding:10px 14px;border-radius:8px;'>"
                + "                ⏱ <strong>Validez:</strong> Este código expira en <strong>10 minutos</strong>. Nunca compartas este código con terceros."
                + "              </p>"
                + "              <p style='margin:20px 0 0 0;font-size:12px;line-height:1.5;color:#64748b;'>"
                + "                Si no intentaste iniciar sesión en Roomix Abancay, por favor desestima este mensaje."
                + "              </p>"
                + "            </td>"
                + "          </tr>"
                + "          <tr>"
                + "            <td style='background-color:#090d16;padding:20px 40px;text-align:center;border-top:1px solid #1e293b;font-size:12px;color:#475569;'>"
                + "              © 2026 Code Arcadia - Roomix Abancay. Todos los derechos reservados."
                + "            </td>"
                + "          </tr>"
                + "        </table>"
                + "      </td>"
                + "    </tr>"
                + "  </table>"
                + "</body>"
                + "</html>";
    }
}
