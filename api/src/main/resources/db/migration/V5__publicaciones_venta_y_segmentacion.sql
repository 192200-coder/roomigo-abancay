-- V5: la tabla rooms pasa a representar una "publicación" (cuarto, minidepartamento,
-- departamento o casa entera) que puede ofrecerse en ALQUILER o en VENTA.
--
-- 1) Tipos orientados al público (reemplazan SINGLE / DOUBLE / SUITE / SHARED):
--      ROOM            Cuarto            → estudiantes
--      MINI_APARTMENT  Minidepartamento  → parejas
--      APARTMENT       Departamento      → familias grandes
--      HOUSE           Casa entera
-- 2) operation = RENT | SALE. En venta no hay renta ni depósito: hay precio de venta,
--    dormitorios, baños y áreas (size_sqm = área construida).
-- 3) Nuevo estado SOLD para publicaciones vendidas.

-- ------------------------------------------------------------ tipos
ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS rooms_room_type_check;

UPDATE public.rooms SET room_type = CASE room_type
    WHEN 'SINGLE' THEN 'ROOM'
    WHEN 'SHARED' THEN 'ROOM'
    WHEN 'DOUBLE' THEN 'MINI_APARTMENT'
    WHEN 'SUITE'  THEN 'APARTMENT'
    ELSE room_type
END;

ALTER TABLE public.rooms ADD CONSTRAINT rooms_room_type_check
    CHECK (room_type IN ('ROOM', 'MINI_APARTMENT', 'APARTMENT', 'HOUSE'));

-- ------------------------------------------------------------ operación y datos de venta
ALTER TABLE public.rooms
    ADD COLUMN operation varchar(10) NOT NULL DEFAULT 'RENT',
    ADD COLUMN sale_price numeric(12,2),
    ADD COLUMN bedrooms integer,
    ADD COLUMN bathrooms integer,
    ADD COLUMN land_area_sqm double precision;

ALTER TABLE public.rooms ADD CONSTRAINT rooms_operation_check
    CHECK (operation IN ('RENT', 'SALE'));

-- En venta no existen renta mensual ni depósito.
ALTER TABLE public.rooms ALTER COLUMN price_per_month DROP NOT NULL;
ALTER TABLE public.rooms ALTER COLUMN deposit_price DROP NOT NULL;

-- Cada operación exige sus precios.
ALTER TABLE public.rooms ADD CONSTRAINT rooms_operation_prices_check CHECK (
    (operation = 'RENT' AND price_per_month IS NOT NULL AND deposit_price IS NOT NULL)
    OR (operation = 'SALE' AND sale_price IS NOT NULL)
);

ALTER TABLE public.rooms ADD CONSTRAINT rooms_counts_check CHECK (
    (bedrooms IS NULL OR bedrooms >= 0) AND (bathrooms IS NULL OR bathrooms >= 0)
);

-- ------------------------------------------------------------ estados
ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS rooms_status_check;
ALTER TABLE public.rooms ADD CONSTRAINT rooms_status_check CHECK (status IN (
    'PENDING_APPROVAL', 'AVAILABLE', 'RENTED', 'OCCUPIED', 'MAINTENANCE', 'REJECTED', 'SOLD'
));

-- El catálogo filtra por estado + operación + tipo.
CREATE INDEX IF NOT EXISTS idx_rooms_status_operation_type
    ON public.rooms (status, operation, room_type);
