import { Order } from '../types';

/**
 * Genera la URL oficial de WhatsApp (wa.me) con el mensaje preformateado y limpio.
 * No marca el pedido como pagado ni confirmado de manera automática.
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

  const message = `🌸 *HOLA ${order.floristName.toUpperCase()}, NUEVO PEDIDO LUNARIA #${order.id}*

Hola, soy *${order.buyerName}*. Acabo de generar un pedido en la plataforma Lunaria y me gustaría confirmar detalles de pago y entrega:

📦 *Detalle del pedido:*
${itemsList}

💰 *Subtotal productos:* $${(order.totalAmount - order.deliveryFee).toLocaleString('es-MX')} MXN
🚚 *Costo de envío:* ${order.deliveryFee > 0 ? `$${order.deliveryFee} MXN` : 'Sin costo (Recolección)'}
🏷️ *TOTAL ESTIMADO:* $${order.totalAmount.toLocaleString('es-MX')} MXN

📍 *Modalidad:* ${deliveryTypeStr}${dateStr}${cardStr}${notesStr}

¿Podrían indicarme sus datos de transferencia bancaria / instrucciones para finalizar? ¡Muchas gracias!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
