# Project Structure

## Backend

- `api/src/main/java/com/roomix/api/config`: application, security, CORS, initialization and OpenAPI.
- `api/src/main/java/com/roomix/api/controller`: HTTP/API boundary.
- `api/src/main/java/com/roomix/api/dto`: request/response contracts.
- `api/src/main/java/com/roomix/api/entity`: persistence model and enums.
- `api/src/main/java/com/roomix/api/repository`: Spring Data repositories and specifications.
- `api/src/main/java/com/roomix/api/service`: business interfaces and implementations.
- `api/src/main/java/com/roomix/api/security`: JWT, rate limiting and brute-force controls.
- `api/src/main/resources`: environment configuration and Supabase SQL.
- `api/src/test`: integration tests and H2 test configuration.

## Frontend

- `frontend/src/app/components`: UI components and feature views.
- `frontend/src/app/core`: API clients, auth, models, favorites, mock data and payments.
- `frontend/src/app`: root composition and shared styling.
- `frontend/public`: static assets and design exports.
- `frontend/scripts`: component-size validation.

Generated directories (`node_modules`, `.angular`, `dist`, `target`, `.m2`) are build outputs/cache and are excluded from source conclusions.
