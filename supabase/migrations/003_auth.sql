-- ==============================================================================
-- LUNARIA · Migración 003: inicio de sesión con Supabase Auth
--
-- Ejecuta este script UNA vez en el SQL Editor de Supabase si tu base se creó
-- con una versión anterior de supabase/schema.sql. (schema.sql ya lo incluye.)
-- No borra datos.
--
-- Cada perfil de la app (public.profiles) se vincula con su cuenta de acceso
-- (auth.users) mediante auth_user_id. Los perfiles de ejemplo se vinculan solos
-- la primera vez que alguien inicia sesión con su correo.
-- ==============================================================================

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS auth_user_id TEXT UNIQUE;
