package com.roomix.api.exception;

import com.roomix.api.dto.common.ErrorDetailDto;
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

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorDetailDto> handleGlobalException(Exception ex) {
        String msg = ex.getLocalizedMessage() != null ? ex.getLocalizedMessage() : "Ocurrió un error inesperado en el servidor.";
        ErrorDetailDto error = ErrorDetailDto.of("Error interno del servidor", List.of(msg));
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
