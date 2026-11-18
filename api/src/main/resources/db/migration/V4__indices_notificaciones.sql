-- V4: índices para las notificaciones.
-- La campana del frontend consulta periódicamente el contador de no leídas de cada usuario
-- y la lista ordenada por fecha; sin índice ambas consultas recorren toda la tabla.

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON public.notifications (user_id)
    WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
    ON public.notifications (user_id, created_at DESC, id DESC);
