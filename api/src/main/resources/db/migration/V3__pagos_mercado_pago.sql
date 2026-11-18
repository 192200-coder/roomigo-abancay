-- V3: integración real con Mercado Pago (Checkout Pro).
--
-- 1) payments deja de ser exclusiva de reservas: también registra la tarifa de
--    publicación de un cuarto (purpose = ROOM_PUBLICATION, room_id).
-- 2) Se guardan los identificadores de Mercado Pago para conciliar pagos de forma
--    idempotente (external_reference propio + id del pago en Mercado Pago).
-- 3) reservations.initial_payment: monto que se cobra al pagar la reserva
--    (primer mes + depósito), fijado al crearla para que no cambie si el
--    propietario modifica después el precio del cuarto.

-- ---------------------------------------------------------------- payments
ALTER TABLE public.payments ALTER COLUMN reservation_id DROP NOT NULL;

ALTER TABLE public.payments
    ADD COLUMN purpose varchar(30) NOT NULL DEFAULT 'BOOKING',
    ADD COLUMN room_id bigint,
    ADD COLUMN external_reference varchar(80),
    ADD COLUMN preference_id varchar(120),
    ADD COLUMN provider_payment_id varchar(40),
    ADD COLUMN status_detail varchar(80),
    ADD COLUMN created_at timestamp(6) without time zone,
    ADD COLUMN updated_at timestamp(6) without time zone;

ALTER TABLE public.payments ALTER COLUMN purpose DROP DEFAULT;

-- Pagos existentes (simulados, todos de reservas): referencia propia derivada.
UPDATE public.payments
SET external_reference = 'BOOKING-' || reservation_id,
    created_at = COALESCE(paid_at, now())
WHERE external_reference IS NULL;

ALTER TABLE public.payments ALTER COLUMN external_reference SET NOT NULL;

ALTER TABLE public.payments
    ADD CONSTRAINT payments_purpose_check CHECK (purpose IN ('BOOKING', 'ROOM_PUBLICATION')),
    ADD CONSTRAINT payments_target_check CHECK (
        (purpose = 'BOOKING' AND reservation_id IS NOT NULL AND room_id IS NULL) OR
        (purpose = 'ROOM_PUBLICATION' AND room_id IS NOT NULL AND reservation_id IS NULL)
    ),
    ADD CONSTRAINT payments_external_reference_key UNIQUE (external_reference),
    ADD CONSTRAINT payments_provider_payment_id_key UNIQUE (provider_payment_id),
    ADD CONSTRAINT payments_room_id_key UNIQUE (room_id),
    ADD CONSTRAINT fk_payments_room FOREIGN KEY (room_id) REFERENCES public.rooms (id);

-- ------------------------------------------------------------ reservations
ALTER TABLE public.reservations ADD COLUMN initial_payment numeric(10, 2);

-- Reservas existentes: primer mes + depósito según el precio actual del cuarto.
UPDATE public.reservations r
SET initial_payment = ro.price_per_month + ro.deposit_price
FROM public.rooms ro
WHERE ro.id = r.room_id AND r.initial_payment IS NULL;

ALTER TABLE public.reservations ALTER COLUMN initial_payment SET NOT NULL;
