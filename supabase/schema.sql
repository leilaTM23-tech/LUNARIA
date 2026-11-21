-- ==============================================================================
-- LUNARIA: Esquema completo de base de datos para Supabase
--
-- Cómo usarlo:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Pega este archivo completo y presiona "Run"
--   3. Carga los datos de ejemplo:  npm run seed:supabase
--      (o desde la app con el botón "Restablecer demo" del banner superior)
--
-- ⚠️ Este script BORRA y vuelve a crear todas las tablas de Lunaria.
--    Úsalo solo para inicializar o reiniciar el entorno de desarrollo.
--
-- Notas de diseño (proyecto escolar):
--   * Los IDs son TEXT (ej. 'flor-petalos-tlaxcala', 'LUN-4821') para coincidir
--     con los datos de ejemplo de src/data/seedData.ts.
--   * Los datos anidados (direcciones, items del pedido, historial, zonas de
--     entrega, imágenes) se guardan como JSONB.
--   * RLS está habilitado pero con políticas abiertas: cualquiera con la anon key
--     puede leer y escribir. Suficiente para una demo, NO para producción.
-- ==============================================================================

-- ---------------------------------------------------------------------------
-- 0. Limpieza (orden inverso a las dependencias)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS public.application_audit_logs CASCADE;
DROP TABLE IF EXISTS public.florist_applications   CASCADE;
DROP TABLE IF EXISTS public.florist_invitations    CASCADE;
DROP TABLE IF EXISTS public.orders                 CASCADE;
DROP TABLE IF EXISTS public.product_offers         CASCADE;
DROP TABLE IF EXISTS public.catalog_products       CASCADE;
DROP TABLE IF EXISTS public.florists               CASCADE;
DROP TABLE IF EXISTS public.profiles               CASCADE;
DROP TABLE IF EXISTS public.categories             CASCADE;
DROP TABLE IF EXISTS public.communities            CASCADE;

-- ---------------------------------------------------------------------------
-- 1. Catálogos base
-- ---------------------------------------------------------------------------
CREATE TABLE public.communities (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    municipality  TEXT NOT NULL,
    postal_codes  JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    notes         TEXT
);

CREATE TABLE public.categories (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    slug         TEXT NOT NULL,
    description  TEXT NOT NULL DEFAULT '',
    icon_name    TEXT,
    sort_order   INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- 2. Usuarios
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
    id          TEXT PRIMARY KEY,
    email       TEXT NOT NULL,
    full_name   TEXT NOT NULL,
    phone       TEXT NOT NULL DEFAULT '',
    role        TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'florist', 'admin')),
    avatar_url  TEXT,
    florist_id  TEXT,
    addresses   JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 3. Florerías
-- ---------------------------------------------------------------------------
CREATE TABLE public.florists (
    id                   TEXT PRIMARY KEY,
    owner_id             TEXT NOT NULL,
    commercial_name      TEXT NOT NULL,
    business_name        TEXT,
    email                TEXT,
    slug                 TEXT NOT NULL,
    description          TEXT NOT NULL DEFAULT '',
    address              TEXT NOT NULL DEFAULT '',
    community_id         TEXT NOT NULL,
    phone                TEXT NOT NULL DEFAULT '',
    whatsapp             TEXT NOT NULL DEFAULT '',
    instagram            TEXT,
    opening_hours        TEXT NOT NULL DEFAULT '',
    order_agent_name     TEXT NOT NULL DEFAULT '',
    registration_method  TEXT NOT NULL DEFAULT 'public_application'
                         CHECK (registration_method IN ('invitation', 'public_application')),
    status               TEXT NOT NULL DEFAULT 'pending_review'
                         CHECK (status IN ('draft', 'pending_review', 'info_required', 'approved', 'rejected', 'suspended')),
    approved_at          TIMESTAMPTZ,
    rejected_at          TIMESTAMPTZ,
    suspended_at         TIMESTAMPTZ,
    rejection_reason     TEXT,
    suspension_reason    TEXT,
    info_required_notes  TEXT,
    rating               NUMERIC(2,1) NOT NULL DEFAULT 5.0,
    review_count         INTEGER NOT NULL DEFAULT 0,
    delivery_zones       JSONB NOT NULL DEFAULT '[]'::jsonb,  -- DeliveryZoneRule[]
    delivery_coverage    JSONB,                                -- string[] (ids de comunidades)
    banner_url           TEXT,
    logo_url             TEXT,
    featured             BOOLEAN DEFAULT FALSE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 4. Catálogo maestro y ofertas por florería
-- ---------------------------------------------------------------------------
CREATE TABLE public.catalog_products (
    id                    TEXT PRIMARY KEY,
    category_id           TEXT NOT NULL REFERENCES public.categories(id),
    name                  TEXT NOT NULL,
    slug                  TEXT NOT NULL,
    description           TEXT NOT NULL DEFAULT '',
    flower_types          JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommended_occasion  TEXT NOT NULL DEFAULT '',
    default_image_url     TEXT NOT NULL DEFAULT '',
    is_active             BOOLEAN NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.product_offers (
    id                     TEXT PRIMARY KEY,
    catalog_product_id     TEXT NOT NULL REFERENCES public.catalog_products(id),
    florist_id             TEXT NOT NULL REFERENCES public.florists(id) ON DELETE CASCADE,
    title                  TEXT NOT NULL,
    description            TEXT NOT NULL DEFAULT '',
    price                  NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    compare_price          NUMERIC(10,2),
    stock                  INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    images                 JSONB NOT NULL DEFAULT '[]'::jsonb,
    preparation_time       TEXT NOT NULL DEFAULT '',
    same_day_delivery      BOOLEAN NOT NULL DEFAULT FALSE,
    is_published           BOOLEAN NOT NULL DEFAULT TRUE,
    sales_count            INTEGER NOT NULL DEFAULT 0,
    customization_options  JSONB,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_offers_florist ON public.product_offers(florist_id);

-- ---------------------------------------------------------------------------
-- 5. Pedidos
-- ---------------------------------------------------------------------------
CREATE TABLE public.orders (
    id                       TEXT PRIMARY KEY,               -- Ej. 'LUN-4821'
    buyer_id                 TEXT NOT NULL,
    buyer_name               TEXT NOT NULL,
    buyer_phone              TEXT NOT NULL DEFAULT '',
    buyer_email              TEXT NOT NULL DEFAULT '',
    florist_id               TEXT NOT NULL REFERENCES public.florists(id),
    florist_name             TEXT NOT NULL,
    florist_phone            TEXT NOT NULL DEFAULT '',
    florist_whatsapp         TEXT NOT NULL DEFAULT '',
    items                    JSONB NOT NULL DEFAULT '[]'::jsonb,  -- OrderItem[]
    total_amount             NUMERIC(10,2) NOT NULL,
    delivery_fee             NUMERIC(10,2) NOT NULL DEFAULT 0,
    delivery_method          TEXT NOT NULL CHECK (delivery_method IN ('delivery', 'pickup')),
    delivery_address         JSONB,                                -- Address
    delivery_community_id    TEXT NOT NULL,
    delivery_community_name  TEXT NOT NULL,
    scheduled_date           TEXT,
    scheduled_time_window    TEXT,
    card_message             TEXT,
    special_notes            TEXT,
    status                   TEXT NOT NULL DEFAULT 'awaiting_payment'
                             CONSTRAINT orders_status_check
                             CHECK (status IN ('awaiting_payment', 'pending_contact', 'contacted', 'confirmed_by_vendor',
                                               'in_preparation', 'on_the_way', 'delivered', 'cancelled')),
    status_history           JSONB NOT NULL DEFAULT '[]'::jsonb,  -- OrderStatusHistoryItem[]
    whatsapp_message_sent    BOOLEAN NOT NULL DEFAULT FALSE,
    -- Pago en línea (Stripe Checkout)
    payment_status           TEXT NOT NULL DEFAULT 'pending'
                             CONSTRAINT orders_payment_status_check
                             CHECK (payment_status IN ('pending', 'paid')),
    paid_at                  TIMESTAMPTZ,
    stripe_session_id        TEXT,
    stripe_payment_intent_id TEXT,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer   ON public.orders(buyer_id);
CREATE INDEX idx_orders_florist ON public.orders(florist_id);
CREATE INDEX idx_orders_stripe_session ON public.orders(stripe_session_id);

-- ---------------------------------------------------------------------------
-- 6. Alta de florerías: invitaciones, solicitudes y bitácora
-- ---------------------------------------------------------------------------
CREATE TABLE public.florist_invitations (
    id               TEXT PRIMARY KEY,
    email            TEXT NOT NULL,
    business_name    TEXT NOT NULL,
    token            TEXT NOT NULL UNIQUE,
    token_hash       TEXT NOT NULL,
    expires_at       TIMESTAMPTZ NOT NULL,
    used_at          TIMESTAMPTZ,
    revoked_at       TIMESTAMPTZ,
    created_by       TEXT NOT NULL,
    created_by_name  TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.florist_applications (
    id                       TEXT PRIMARY KEY,
    applicant_id             TEXT NOT NULL,
    florist_id               TEXT NOT NULL REFERENCES public.florists(id) ON DELETE CASCADE,
    registration_method      TEXT NOT NULL CHECK (registration_method IN ('invitation', 'public_application')),
    status                   TEXT NOT NULL DEFAULT 'pending_review',
    submitted_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_by              TEXT,
    reviewed_at              TIMESTAMPTZ,
    review_notes             TEXT,
    info_required_notes      TEXT,
    applicant_name           TEXT NOT NULL,
    applicant_email          TEXT NOT NULL DEFAULT '',
    applicant_phone          TEXT NOT NULL DEFAULT '',
    business_name            TEXT NOT NULL,
    community_id             TEXT NOT NULL,
    community_name           TEXT,
    address                  TEXT NOT NULL DEFAULT '',
    description              TEXT NOT NULL DEFAULT '',
    opening_hours            TEXT NOT NULL DEFAULT '',
    whatsapp                 TEXT NOT NULL DEFAULT '',
    phone                    TEXT NOT NULL DEFAULT '',
    delivery_modes           JSONB NOT NULL DEFAULT '["delivery"]'::jsonb,
    delivery_communities     JSONB NOT NULL DEFAULT '[]'::jsonb,
    estimated_delivery_time  TEXT NOT NULL DEFAULT '',
    logo_url                 TEXT,
    invitation_id            TEXT
);

CREATE TABLE public.application_audit_logs (
    id               TEXT PRIMARY KEY,
    application_id   TEXT NOT NULL,      -- id de solicitud o 'invitation-<id>'
    actor_id         TEXT NOT NULL,
    actor_name       TEXT NOT NULL,
    action           TEXT NOT NULL,
    previous_status  TEXT,
    new_status       TEXT,
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_application ON public.application_audit_logs(application_id);

-- ---------------------------------------------------------------------------
-- 7. Seguridad: RLS con acceso abierto (solo para desarrollo / demo escolar)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'communities', 'categories', 'profiles', 'florists', 'catalog_products',
        'product_offers', 'orders', 'florist_invitations', 'florist_applications',
        'application_audit_logs'
    ]
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Acceso abierto demo" ON public.%I', t);
        EXECUTE format(
            'CREATE POLICY "Acceso abierto demo" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)',
            t
        );
    END LOOP;
END $$;
