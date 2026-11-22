import { Order } from '../types';

/**
 * Cliente de la API de pagos (server/payments.ts).
 * El navegador solo manda folios de pedido; los montos los calcula el servidor desde la base.
 */

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Error ${res.status} en el servicio de pagos.`);
  return body as T;
}

/** Crea la sesión de Stripe Checkout para los pedidos y redirige al comprador a pagar. */
export async function startOnlinePayment(orderIds: string[]): Promise<void> {
  const { url } = await request<{ url: string }>('/api/checkout/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderIds }),
  });
  window.location.assign(url);
}

export interface PaymentResult {
  paymentStatus: 'paid' | 'unpaid' | 'no_payment_required';
  amountTotal: number;
  orders: Order[];
}

/** Consulta el resultado del pago al volver de Stripe (el servidor confirma los pedidos si ya se pagó). */
export function getPaymentResult(sessionId: string): Promise<PaymentResult> {
  return request<PaymentResult>(`/api/checkout/session/${encodeURIComponent(sessionId)}`);
}
