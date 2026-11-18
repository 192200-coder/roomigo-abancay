package com.roomix.api.exception;

import com.roomix.api.dto.common.ErrorDetailDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.ArrayList;
import java.util.List;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorDetailDto> handleResourceNotFoundException(ResourceNotFoundException ex) {
        ErrorDetailDto error = ErrorDetailDto.of(ex.getMessage(), List.of("El recurso solicitado no fue encontrado."));
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorDetailDto> handleBadRequestException(BadRequestException ex) {
        ErrorDetailDto error = ErrorDetailDto.of(ex.getMessage(), List.of("Solicitud incorrecta o parámetros inválidos."));
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorDetailDto> handleConflictException(ConflictException ex) {
        ErrorDetailDto error = ErrorDetailDto.of(ex.getMessage(), List.of("Conflicto con el estado actual del recurso."));
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorDetailDto> handleUnauthorizedException(UnauthorizedException ex) {
        ErrorDetailDto error = ErrorDetailDto.of(ex.getMessage(), List.of("No autorizado para realizar esta acción."));
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorDetailDto> handleValidationExceptions(MethodArgumentNotValidException ex) {
        List<String> errors = new ArrayList<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.add(fieldName + ": " + errorMessage);
        });
        ErrorDetailDto error = ErrorDetailDto.of("Error de validación de datos de entrada", errors);
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorDetailDto> handleBadCredentialsException(BadCredentialsException ex) {
        ErrorDetailDto error = ErrorDetailDto.of("Credenciales de acceso inválidas", List.of("Correo o contraseña incorrectos."));
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorDetailDto> handleAccessDeniedException(AccessDeniedException ex) {
        ErrorDetailDto error = ErrorDetailDto.of("Acceso Denegado", List.of("No posee los permisos o roles necesarios para acceder a este recurso."));
        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorDetailDto> handleMethodArgumentTypeMismatch(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex) {
        String detail = String.format("El parámetro '%s' con valor '%s' no es válido. Se esperaba tipo %s.",
                ex.getName(), ex.getValue(), ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "válido");
        ErrorDetailDto error = ErrorDetailDto.of("Parámetro de solicitud inválido", List.of(detail));
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorDetailDto> handleHttpMessageNotReadable(org.springframework.http.converter.HttpMessageNotReadableException ex) {
        ErrorDetailDto error = ErrorDetailDto.of("Cuerpo de solicitud JSON inválido o malformado", List.of("Verifique el formato y los tipos de datos enviados en el JSON."));
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(org.springframework.web.bind.MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorDetailDto> handleMissingServletRequestParameter(org.springframework.web.bind.MissingServletRequestParameterException ex) {
        ErrorDetailDto error = ErrorDetailDto.of("Parámetro requerido ausente", List.of("El parámetro '" + ex.getParameterName() + "' es obligatorio."));
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorDetailDto> handleMethodNotSupported(org.springframework.web.HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(ErrorDetailDto.of("Método no permitido", List.of("El método solicitado no está disponible para este recurso.")));
    }

    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<ErrorDetailDto> handleMissingResource(org.springframework.web.servlet.resource.NoResourceFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorDetailDto.of("Recurso no encontrado", List.of("El recurso solicitado no existe.")));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorDetailDto> handleGlobalException(Exception ex) {
        log.error("Error inesperado procesando la solicitud", ex);
        ErrorDetailDto error = ErrorDetailDto.of("Error interno del servidor", List.of("Ocurrió un error inesperado en el servidor."));
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
