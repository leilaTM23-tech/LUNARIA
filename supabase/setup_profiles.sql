-- ==============================================================================
-- LUNARIA / FloraTlax: Script de Configuración de Perfiles y RLS para Supabase
-- Ejecuta este script en el SQL Editor del panel de control de Supabase
-- ==============================================================================

-- 1. Crear tabla profiles si no existe
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'florist', 'admin')),
    avatar_url TEXT,
    florist_id TEXT,
    addresses JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de acceso público/anónimo para desarrollo y lectura general
DROP POLICY IF EXISTS "Lectura pública de perfiles" ON public.profiles;
CREATE POLICY "Lectura pública de perfiles" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Inserción y actualización para usuarios" ON public.profiles;
CREATE POLICY "Inserción y actualización para usuarios" ON public.profiles
    FOR ALL USING (true) WITH CHECK (true);

-- 4. Registrar a Leilani TM como Administradora Principal
INSERT INTO public.profiles (id, email, full_name, phone, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'leilani.tm@lunaria.mx',
    'Leilani TM',
    '246 123 7890',
    'admin'
)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = 'admin',
    updated_at = NOW();

-- 5. Registrar también a Lic. Elena Morales como Administradora Secundaria
INSERT INTO public.profiles (id, email, full_name, phone, role)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'elena.morales@lunaria.mx',
    'Lic. Elena Morales',
    '246 123 4567',
    'admin'
)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = 'admin',
    updated_at = NOW();

