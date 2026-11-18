# Data Model

## Core entities

- `User` belongs to a `Role` and owns properties or creates reservations/reviews/favorites.
- `Property` belongs to an owner and contains rooms.
- `Room` belongs to a property and relates to images and amenities.
- `Reservation` links a tenant to a room over a date range.
- `Payment` links to a reservation and may influence reservation/room publication state.
- `Review` links a tenant reservation to a room.
- `Notification`, `Favorite` and `VerificationCode` support user workflows.

## Integrity concerns

- Reservation overlap and payment idempotency require database constraints/transactions.
- Lists returned by services should be paged consistently.
- RLS and schema changes belong in versioned migrations rather than startup best-effort SQL.
- Sensitive columns must never be exposed through generic PostgREST or unfiltered entity serialization.
