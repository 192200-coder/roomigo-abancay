-- V2: las reservas se contratan por número de meses (no por rango libre de días).
-- La fecha de fin pasa a calcularse en el backend como start_date + months.
-- Se guarda "months" explícitamente porque no puede deducirse de las fechas
-- (31-ene + 1 mes = 28-feb, y esa diferencia es de 0 meses completos).

ALTER TABLE public.reservations ADD COLUMN months integer;

-- Reservas existentes: aproximar los meses a partir de los días de estadía.
UPDATE public.reservations
SET months = GREATEST(1, ROUND((end_date - start_date) / 30.0))
WHERE months IS NULL;

ALTER TABLE public.reservations ALTER COLUMN months SET NOT NULL;
ALTER TABLE public.reservations
    ADD CONSTRAINT reservations_months_check CHECK (months BETWEEN 1 AND 12) NOT VALID;
