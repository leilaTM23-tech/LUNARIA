/**
 * API de pagos de Lunaria (Stripe Checkout).
 *
 * Corre en el servidor (montada dentro de Vite, ver vite.config.ts), así que es el único
 * lugar que conoce STRIPE_SECRET_KEY. El navegador nunca envía montos: se leen de la base.
 *
 * Rutas (bajo /api):
 *   POST /checkout/session        { orderIds }  → crea la sesión de pago y devuelve { url }
 *   GET  /checkout/session/:id                  → consulta la sesión; si está pagada, confirma los pedidos
 *   POST /stripe/webhook                        → (opcional) confirmación por webhook de Stripe
 */
import express from 'express';
import Stripe from 'stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { fromRow, toRow } from '../src/services/supabaseMapping';
import type { Order, ProductOffer } from '../src/types';

export interface PaymentsConfig {
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  supabaseUrl: string;
  supabaseKey: string;
  /** URL pública de la app; si no se da, se usa el Origin de la petición. */
  appUrl?: string;
}

const MAX_ORDERS_PER_SESSION = 20;
const toCents = (mxn: number) => Math.round(mxn * 100);

// -----------------------------------------------------------------------------
// Lógica de negocio (exportada para poder probarla sin pasar por HTTP)
// -----------------------------------------------------------------------------

async function loadOrders(db: SupabaseClient, ids: string[]): Promise<Order[]> {
  const { data, error } = await db.from('orders').select('*').in('id', ids);
  if (error) throw new Error(`No se pudieron leer los pedidos: ${error.message}`);
  return (data ?? []).map((row) => fromRow<Order>('orders', row));
}

/** Convierte los pedidos en las líneas que verá el comprador en Stripe Checkout. */
export function buildLineItems(orders: Order[]): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const lines: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  for (const order of orders) {
    for (const item of order.items) {
      lines.push({
        quantity: item.quantity,
        price_data: {
          currency: 'mxn',
          unit_amount: toCents(item.unitPrice),
          product_data: {
            name: item.productTitle,
            description: `${order.floristName} · Pedido #${order.id}`,
            ...(item.productImage?.startsWith('https://') && { images: [item.productImage] }),
          },
        },
      });
    }
    if (order.deliveryFee > 0) {
      lines.push({
        quantity: 1,
        price_data: {
          currency: 'mxn',
          unit_amount: toCents(order.deliveryFee),
          product_data: {
            name: `Envío a ${order.deliveryCommunityName}`,
            description: `${order.floristName} · Pedido #${order.id}`,
          },
        },
      });
    }
  }
  return lines;
}

/**
 * Marca los pedidos como pagados, los pasa a "Pendiente de contacto" y descuenta stock.
 * Es idempotente: si el webhook y la página de retorno llegan a la vez, solo uno aplica
 * el cambio (el UPDATE está condicionado a payment_status = 'pending').
 * Devuelve los ids que se confirmaron en esta llamada.
 */
export async function confirmPaidOrders(
  db: SupabaseClient,
  orderIds: string[],
  paymentIntentId?: string
): Promise<string[]> {
  const confirmed: string[] = [];
  const orders = await loadOrders(db, orderIds);
  const now = new Date().toISOString();

  for (const order of orders) {
    if (order.paymentStatus === 'paid') continue;

    const changes = toRow('orders', {
      paymentStatus: 'paid',
      paidAt: now,
      stripePaymentIntentId: paymentIntentId,
      status: 'pending_contact',
      updatedAt: now,
      statusHistory: [
        ...(order.statusHistory ?? []),
        {
          status: 'pending_contact',
          timestamp: now,
          changedBy: 'Stripe (pago en línea)',
          note: `Pago de $${order.totalAmount.toLocaleString('es-MX')} MXN confirmado. La florería ya puede contactar al comprador.`,
        },
      ],
    });

    const { data, error } = await db
      .from('orders')
      .update(changes)
      .eq('id', order.id)
      .eq('payment_status', 'pending')
      .select('id');
    if (error) throw new Error(`No se pudo confirmar el pedido ${order.id}: ${error.message}`);
    if (!data?.length) continue; // otro proceso ya lo confirmó

    confirmed.push(order.id);

    // Descontar stock y sumar ventas (solo una vez, tras confirmar el pago)
    for (const item of order.items) {
      const { data: offerRow } = await db.from('product_offers').select('*').eq('id', item.offerId).maybeSingle();
      if (!offerRow) continue;
      const offer = fromRow<ProductOffer>('product_offers', offerRow);
      await db
        .from('product_offers')
        .update(
          toRow('product_offers', {
            stock: Math.max(0, offer.stock - item.quantity),
            salesCount: (offer.salesCount || 0) + item.quantity,
            updatedAt: now,
          })
        )
        .eq('id', offer.id);
    }
  }
  return confirmed;
}

function orderIdsFromSession(session: Stripe.Checkout.Session): string[] {
  return (session.metadata?.order_ids ?? '').split(',').filter(Boolean);
}

function paymentIntentId(session: Stripe.Checkout.Session): string | undefined {
  const pi = session.payment_intent;
  return typeof pi === 'string' ? pi : pi?.id;
}

// -----------------------------------------------------------------------------
// API HTTP
// -----------------------------------------------------------------------------

export function createPaymentsApi(config: PaymentsConfig): express.Express {
  const app = express();
  // Si faltan las variables de Supabase no tumbamos `npm run dev`: usamos un cliente
  // de relleno y requireStripe responde 503 con un mensaje claro.
  const db = createClient(
    config.supabaseUrl || 'http://supabase-no-configurado.invalid',
    config.supabaseKey || 'sin-clave'
  );
  const stripe = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;

  const requireStripe: express.RequestHandler = (_req, res, next) => {
    if (!config.supabaseUrl || !config.supabaseKey) {
      res.status(503).json({ error: 'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en .env.local.' });
      return;
    }
    if (!stripe) {
      res.status(503).json({
        error: 'Pagos no configurados: falta STRIPE_SECRET_KEY en .env.local (reinicia npm run dev después de agregarla).',
      });
      return;
    }
    next();
  };

  // --- Webhook (opcional). Va ANTES de express.json() porque necesita el cuerpo sin procesar.
  app.post('/stripe/webhook', express.raw({ type: 'application/json' }), requireStripe, async (req, res) => {
    if (!config.stripeWebhookSecret) {
      res.status(503).json({ error: 'Falta STRIPE_WEBHOOK_SECRET.' });
      return;
    }
    let event: Stripe.Event;
    try {
      event = stripe!.webhooks.constructEvent(req.body, req.headers['stripe-signature'] as string, config.stripeWebhookSecret);
    } catch (err) {
      res.status(400).json({ error: `Firma inválida: ${(err as Error).message}` });
      return;
    }

    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === 'paid') {
        await confirmPaidOrders(db, orderIdsFromSession(session), paymentIntentId(session));
      }
    }
    res.json({ received: true });
  });

  app.use(express.json());

  // --- Crear sesión de pago para uno o varios pedidos (carrito con varias florerías)
  app.post('/checkout/session', requireStripe, async (req, res) => {
    try {
      const orderIds: unknown = req.body?.orderIds;
      if (
        !Array.isArray(orderIds) ||
        orderIds.length === 0 ||
        orderIds.length > MAX_ORDERS_PER_SESSION ||
        !orderIds.every((id) => typeof id === 'string')
      ) {
        res.status(400).json({ error: 'orderIds debe ser una lista de folios de pedido.' });
        return;
      }

      const orders = await loadOrders(db, orderIds);
      if (orders.length !== orderIds.length) {
        res.status(404).json({ error: 'Alguno de los pedidos no existe.' });
        return;
      }
      if (orders.some((o) => o.paymentStatus === 'paid')) {
        res.status(409).json({ error: 'Alguno de los pedidos ya fue pagado.' });
        return;
      }
      if (orders.some((o) => o.status !== 'awaiting_payment')) {
        res.status(409).json({ error: 'Alguno de los pedidos ya no está esperando pago (¿fue cancelado?).' });
        return;
      }
      if (new Set(orders.map((o) => o.buyerId)).size > 1) {
        res.status(400).json({ error: 'Los pedidos pertenecen a compradores distintos.' });
        return;
      }

      const origin = config.appUrl || req.headers.origin || `http://${req.headers.host}`;
      const ids = orders.map((o) => o.id).join(',');

      const session = await stripe!.checkout.sessions.create({
        mode: 'payment',
        locale: 'es',
        line_items: buildLineItems(orders),
        customer_email: orders[0].buyerEmail || undefined,
        client_reference_id: orders[0].buyerId,
        metadata: { order_ids: ids },
        payment_intent_data: { metadata: { order_ids: ids } },
        success_url: `${origin}/checkout/pago?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout/pago?cancelado=1&pedidos=${encodeURIComponent(ids)}`,
      });

      await db
        .from('orders')
        .update(toRow('orders', { stripeSessionId: session.id, updatedAt: new Date().toISOString() }))
        .in('id', orderIds);

      res.json({ url: session.url, sessionId: session.id });
    } catch (err) {
      console.error('[pagos] Error creando sesión:', err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // --- Consultar el resultado al volver de Stripe (y confirmar si ya está pagado)
  app.get('/checkout/session/:id', requireStripe, async (req, res) => {
    try {
      const session = await stripe!.checkout.sessions.retrieve(req.params.id);
      const orderIds = orderIdsFromSession(session);

      if (session.payment_status === 'paid') {
        await confirmPaidOrders(db, orderIds, paymentIntentId(session));
      }

      res.json({
        paymentStatus: session.payment_status, // 'paid' | 'unpaid' | 'no_payment_required'
        amountTotal: (session.amount_total ?? 0) / 100,
        orders: await loadOrders(db, orderIds),
      });
    } catch (err) {
      console.error('[pagos] Error consultando sesión:', err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return app;
}
