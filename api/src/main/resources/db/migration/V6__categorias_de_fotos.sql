-- V6: cada foto de una publicación indica qué muestra. Las publicaciones nuevas (y las que
-- se editen cambiando sus fotos) deben incluir al menos fachada, habitación y baño.
-- Las fotos existentes quedan como OTHER: las publicaciones antiguas no se bloquean.

ALTER TABLE public.room_images
    ADD COLUMN category varchar(20) NOT NULL DEFAULT 'OTHER';

ALTER TABLE public.room_images ADD CONSTRAINT room_images_category_check
    CHECK (category IN ('FACADE', 'ROOM', 'BATHROOM', 'LIVING_KITCHEN', 'OTHER'));

CREATE INDEX IF NOT EXISTS idx_room_images_room ON public.room_images (room_id, display_order);
