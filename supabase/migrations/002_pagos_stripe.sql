-- ==============================================================================
-- LUNARIA · Migración 002: pagos en línea con Stripe
--
-- Ejecuta este script UNA vez en el SQL Editor de Supabase si tu base se creó
-- con una versión anterior de supabase/schema.sql. (schema.sql ya lo incluye.)
-- No borra datos.
-- ==============================================================================

-- 1. Nuevo estado de pedido: 'awaiting_payment' (esperando pago en línea)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('awaiting_payment', 'pending_contact', 'contacted', 'confirmed_by_vendor',
                      'in_preparation', 'on_the_way', 'delivered', 'cancelled'));

-- 2. Columnas de pago
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
    ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check
    CHECK (payment_status IN ('pending', 'paid'));

CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON public.orders(stripe_session_id);

-- 3. Pedidos que ya existían y avanzaron en el flujo se consideran pagados
UPDATE public.orders
SET payment_status = 'paid'
WHERE status NOT IN ('awaiting_payment', 'cancelled') AND payment_status = 'pending';
