# Roomix Abancay — Architecture Index

This index is derived from the repository audit in [AUDIT-REPORT.md](../../../AUDIT-REPORT.md).

## Units

| Unit | Responsibility | Entry points |
|---|---|---|
| Auth | Registration, login, social verification, JWT | `AuthController`, `AuthServiceImpl` |
| Rooms | Search, publish, update, approve and delete rooms | `RoomController`, `RoomServiceImpl` |
| Properties | Owner property lifecycle | `PropertyController`, `PropertyServiceImpl` |
| Bookings | Tenant requests and owner decisions | `BookingController`, `BookingServiceImpl` |
| Reviews | Create and read room reviews | `ReviewController`, `ReviewServiceImpl` |
| Payments | Payment methods, preferences, callbacks | `PaymentController` |
| Admin | Moderation and statistics | `AdminController` |
| Frontend | Angular UI and API orchestration | `frontend/src/app` |

## Cross-unit dependencies

`Frontend -> Auth/Rooms/Properties/Bookings/Reviews/Payments/Admin -> JPA repositories -> relational database`.

Authentication is cross-cutting through JWT filters and role annotations. Payment state mutates reservations and room publication state, so it requires a transactional gateway boundary before production.

## High-risk seams

- Frontend fallback-to-mock behavior when API calls fail.
- Payment controller directly mutating persistence without provider verification.
- Data initializer executing PostgreSQL-specific hardening against any configured database.
- JWT persisted in browser storage and password recovery implemented client-side.
