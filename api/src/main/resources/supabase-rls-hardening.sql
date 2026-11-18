-- ==============================================================================
-- ROOMIGO ABANCAY - SUPABASE SECURITY & RLS HARDENING SCRIPT
-- Resuelve los 14 avisos críticos del Security Advisor de Supabase:
-- 1. Habilita Row Level Security (RLS) en todas las tablas del esquema público
-- 2. Protege columnas sensibles (password, tokens, pagos) de PostgREST público
-- 3. Mantiene acceso total para el Backend Spring Boot (rol postgres / superuser)
-- ==============================================================================

-- 1. Habilitar RLS en las tablas del sistema (incluye el historial de Flyway)
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.room_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.room_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.flyway_schema_history ENABLE ROW LEVEL SECURITY;

-- 2. Revocar privilegios directos de PostgREST a roles anónimos y autenticados
-- Toda la lógica de negocio y seguridad es gestionada por el Backend Spring Boot (JWT + BCrypt)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
        REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
        REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
        REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
        REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM authenticated;
    END IF;
END $$;

-- 3. Crear políticas restrictivas por defecto (Deny all for public API)
-- El backend Spring Boot usa el rol de base de datos 'postgres' que tiene BYPASSRLS
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'users', 'roles', 'verification_codes', 'properties', 'rooms', 
        'room_images', 'amenities', 'room_amenities', 'reservations', 
        'payments', 'reviews', 'favorites', 'notifications', 'flyway_schema_history'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Deny public PostgREST direct access" ON public.%I;', tbl);
        EXECUTE format('CREATE POLICY "Deny public PostgREST direct access" ON public.%I FOR ALL TO anon, authenticated USING (false);', tbl);
    END LOOP;
END $$;
