import { Order } from '../types';

/**
 * Genera la URL oficial de WhatsApp (wa.me) con el mensaje preformateado y limpio.
 * El pago se realiza en línea (Stripe); WhatsApp se usa para coordinar la entrega.
 */
export function generateWhatsAppOrderUrl(order: Order): string {
  // Limpiar número de teléfono a solo dígitos (E.164 sin signo +)
  const cleanPhone = order.floristWhatsapp.replace(/\D/g, '');

  const itemsList = order.items
    .map((item) => `• ${item.quantity}x ${item.productTitle} ($${item.subtotal.toLocaleString('es-MX')} MXN)`)
    .join('\n');

  const deliveryTypeStr =
    order.deliveryMethod === 'delivery'
      ? `Entrega a domicilio en ${order.deliveryCommunityName}${
          order.deliveryAddress ? ` (${order.deliveryAddress.street} #${order.deliveryAddress.exteriorNumber}, Col. ${order.deliveryAddress.neighborhood})` : ''
        }`
      : `Recolección en tienda (${order.floristName})`;

  const dateStr = order.scheduledDate ? `\n📅 Fecha solicitada: ${order.scheduledDate} ${order.scheduledTimeWindow || ''}` : '';
  const cardStr = order.cardMessage ? `\n💌 Mensaje para tarjeta: "${order.cardMessage}"` : '';
  const notesStr = order.specialNotes ? `\n📝 Notas adicionales: ${order.specialNotes}` : '';

  const isPaid = order.paymentStatus === 'paid';
  const paymentLine = isPaid
    ? 'Ya realicé el *pago en línea* de este pedido en Lunaria (tarjeta, vía Stripe).'
    : 'Generé este pedido en Lunaria y está *pendiente de pago en línea*.';

  const message = `🌸 *HOLA ${order.floristName.toUpperCase()}, NUEVO PEDIDO LUNARIA #${order.id}*

Hola, soy *${order.buyerName}*. ${paymentLine} Me gustaría coordinar los detalles de la entrega:

📦 *Detalle del pedido:*
${itemsList}

💰 *Subtotal productos:* $${(order.totalAmount - order.deliveryFee).toLocaleString('es-MX')} MXN
🚚 *Costo de envío:* ${order.deliveryFee > 0 ? `$${order.deliveryFee} MXN` : 'Sin costo (Recolección)'}
🏷️ *${isPaid ? 'TOTAL PAGADO' : 'TOTAL'}:* $${order.totalAmount.toLocaleString('es-MX')} MXN

📍 *Modalidad:* ${deliveryTypeStr}${dateStr}${cardStr}${notesStr}

¡Muchas gracias!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
