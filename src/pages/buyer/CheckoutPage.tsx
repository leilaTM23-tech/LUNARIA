import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { DeliveryMethod, Address, Order } from '../../types';
import { startOnlinePayment } from '../../services/payments';
import {
  MapPin,
  Calendar,
  Clock,
  Heart,
  Truck,
  Store,
  AlertTriangle,
  ArrowRight,
  CreditCard,
  Lock,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, groupedByFlorist, createCheckoutOrders, clearCart } = useCart();
  const { currentUser } = useAuth();
  const { communities, selectedCommunity } = useMarketplace();

  // Estados del formulario
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    currentUser.addresses[0]?.id || 'custom'
  );

  // Dirección manual / destinatario
  const [recipientName, setRecipientName] = useState(currentUser.fullName);
  const [recipientPhone, setRecipientPhone] = useState(currentUser.phone);
  const [street, setStreet] = useState(currentUser.addresses[0]?.street || 'Calle Juárez');
  const [exteriorNumber, setExteriorNumber] = useState(currentUser.addresses[0]?.exteriorNumber || '12');
  const [neighborhood, setNeighborhood] = useState(currentUser.addresses[0]?.neighborhood || 'Centro');
  const [targetCommunityId, setTargetCommunityId] = useState<string>(
    selectedCommunity?.id || currentUser.addresses[0]?.communityId || communities[0]?.id || 'com-tlaxcala-centro'
  );
  const [reference, setReference] = useState(currentUser.addresses[0]?.reference || 'Casa fachada blanca');

  // Dedicatoria y fecha
  const [cardMessage, setCardMessage] = useState('¡Con todo mi amor y cariño para ti en este día tan especial!');
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [scheduledTimeWindow, setScheduledTimeWindow] = useState('11:00 AM - 2:00 PM');
  const [specialNotes, setSpecialNotes] = useState('Por favor entregar antes de las 2:00 PM.');

  // Proceso
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStock, setErrorStock] = useState<string | null>(null);
  const [createdOrders, setCreatedOrders] = useState<Order[] | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  if (items.length === 0 && !createdOrders) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-3">
        <h2 className="font-serif text-2xl font-semibold text-[#2C2825]">No hay artículos en tu pedido</h2>
        <p className="text-xs text-[#7A736E]">Tu carrito está vacío. Agrega flores para continuar.</p>
        <Link to="/catalogo" className="inline-block px-4 py-2 bg-[#2C2825] text-white rounded-lg text-xs font-semibold">
          Explorar catálogo
        </Link>
      </div>
    );
  }

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStock(null);

    // 1. Validar disponibilidad y stock
    for (const item of items) {
      if (item.offer.stock < item.quantity) {
        setErrorStock(
          `Lo sentimos, el producto "${item.offer.title}" de ${item.florist.commercialName} solo cuenta con ${item.offer.stock} piezas disponibles.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const comm = communities.find((c) => c.id === targetCommunityId);
      const deliveryCommName = comm ? comm.name : 'Tlaxcala';

      const deliveryAddressData: Address = {
        id: `addr-order-${Date.now()}`,
        label: 'Entrega de pedido',
        street,
        exteriorNumber,
        neighborhood,
        communityId: targetCommunityId,
        reference,
        recipientName,
        recipientPhone,
      };

      const orders = await createCheckoutOrders({
        buyerId: currentUser.id,
        buyerName: recipientName || currentUser.fullName,
        buyerPhone: recipientPhone || currentUser.phone,
        buyerEmail: currentUser.email,
        deliveryMethod,
        deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddressData : undefined,
        deliveryCommunityId: targetCommunityId,
        deliveryCommunityName: deliveryCommName,
        scheduledDate,
        scheduledTimeWindow,
        cardMessage,
        specialNotes,
      });

      setCreatedOrders(orders);

      // 2. Ir a pagar a Stripe Checkout (redirige fuera de la app)
      try {
        await startOnlinePayment(orders.map((o) => o.id));
      } catch (err: any) {
        setPaymentError(err.message || 'No se pudo iniciar el pago en línea.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setErrorStock(err.message || 'Error procesando el pedido. Por favor intenta de nuevo.');
      setIsSubmitting(false);
    }
  };

  // Los pedidos se crearon pero no se pudo abrir Stripe (ej. falta STRIPE_SECRET_KEY)
  if (createdOrders && paymentError) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 text-rose-700 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h1 className="font-serif text-2xl font-semibold text-[#2C2825]">No pudimos abrir el pago</h1>
        <p className="text-xs text-[#665E58] leading-relaxed">
          Tus pedidos ({createdOrders.map((o) => `#${o.id}`).join(', ')}) quedaron guardados como{' '}
          <strong>esperando pago</strong>. Puedes reintentar desde aquí o más tarde desde "Mis pedidos".
        </p>
        <p className="text-[11px] text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3">{paymentError}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={async () => {
              setIsSubmitting(true);
              try {
                await startOnlinePayment(createdOrders.map((o) => o.id));
              } catch (err: any) {
                setPaymentError(err.message || 'No se pudo iniciar el pago en línea.');
                setIsSubmitting(false);
              }
            }}
            className="px-5 py-2.5 bg-[#2C2825] hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CreditCard className="w-4 h-4" />
            {isSubmitting ? 'Abriendo Stripe...' : 'Reintentar pago'}
          </button>
          <Link to="/comprador/pedidos" className="text-xs text-[#B25E5C] font-semibold hover:underline">
            Ver mis pedidos
          </Link>
        </div>
      </div>
    );
  }

  // Pedidos creados: mientras el navegador sale hacia Stripe
  if (createdOrders) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-3">
        <CreditCard className="w-10 h-10 mx-auto text-[#B25E5C] animate-pulse" />
        <h1 className="font-serif text-2xl font-semibold text-[#2C2825]">Redirigiendo al pago seguro…</h1>
        <p className="text-xs text-[#7A736E]">Te llevamos a Stripe para completar el pago con tarjeta.</p>
      </div>
    );
  }

  const grandTotal = groupedByFlorist.reduce((acc, g) => {
    const fee = deliveryMethod === 'delivery' ? g.deliveryFee : 0;
    return acc + g.subtotal + fee;
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-6 border-b border-[#EAE3D9]">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#B25E5C] mb-1">
          Finalización de compra
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2C2825]">
          Detalles de entrega y dedicatoria
        </h1>
        <p className="text-xs text-[#7A736E] mt-1">
          Completa los datos para que el florista prepare tu arreglo con el mayor esmero.
        </p>
      </div>

      {errorStock && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
          <span>{errorStock}</span>
        </div>
      )}

      <form onSubmit={handleConfirmOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Formulario principal */}
        <div className="lg:col-span-8 space-y-8">
          {/* 1. Modalidad: Domicilio vs Recolección */}
          <div className="bg-white rounded-3xl p-6 border border-[#EAE3D9] shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-semibold text-[#2C2825] flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#B25E5C]" />
              <span>Modalidad de entrega</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryMethod('delivery')}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  deliveryMethod === 'delivery'
                    ? 'border-[#B25E5C] bg-[#FAF0ED] text-[#8C3D38]'
                    : 'border-[#EAE3D9] hover:bg-[#FAF8F5]'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4 text-[#B25E5C]" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-[#2C2825]">Entrega a domicilio</div>
                  <div className="text-[11px] text-[#7A736E] mt-0.5">
                    Un repartidor de la florería llevará las flores a la dirección indicada.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMethod('pickup')}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  deliveryMethod === 'pickup'
                    ? 'border-[#5A735E] bg-[#F2F6F3] text-[#3E5241]'
                    : 'border-[#EAE3D9] hover:bg-[#FAF8F5]'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4 text-[#5A735E]" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-[#2C2825]">Recolección en taller</div>
                  <div className="text-[11px] text-[#7A736E] mt-0.5">
                    Pasa directamente a la florería por tu pedido listo sin costo de envío.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Dirección de entrega (si es domicilio) */}
          {deliveryMethod === 'delivery' && (
            <div className="bg-white rounded-3xl p-6 border border-[#EAE3D9] shadow-xs space-y-4">
              <h3 className="font-serif text-lg font-semibold text-[#2C2825] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#B25E5C]" />
                <span>Dirección del destinatario en Tlaxcala</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#2C2825] mb-1">Nombre de quien recibe *</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="ej. Mariana Herrera"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#B25E5C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#2C2825] mb-1">Teléfono de contacto *</label>
                  <input
                    type="tel"
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="ej. 246 112 3344"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#B25E5C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#2C2825] mb-1">Calle *</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="ej. Av. Independencia"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#B25E5C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#2C2825] mb-1">Número ext / int *</label>
                  <input
                    type="text"
                    required
                    value={exteriorNumber}
                    onChange={(e) => setExteriorNumber(e.target.value)}
                    placeholder="ej. 24 Int 2B"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#B25E5C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#2C2825] mb-1">Colonia / Barrio *</label>
                  <input
                    type="text"
                    required
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="ej. Centro Histórico"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#B25E5C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#2C2825] mb-1">Comunidad / Municipio *</label>
                  <select
                    value={targetCommunityId}
                    onChange={(e) => setTargetCommunityId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#B25E5C]"
                  >
                    {communities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.municipality})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2C2825] mb-1">Referencias de entrega (fachada, color de puerta, entre calles)</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="ej. Zaguán de madera, portón gris, frente a tienda de abarrotes"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#B25E5C]"
                />
              </div>
            </div>
          )}

          {/* 3. Programación de Entrega y Dedicatoria */}
          <div className="bg-white rounded-3xl p-6 border border-[#EAE3D9] shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-semibold text-[#2C2825] flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#B25E5C]" />
              <span>Mensaje para la tarjeta floral y horario</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-[#2C2825] mb-1">
                Dedicatoria que escribiremos a mano en la tarjeta de cortesía:
              </label>
              <textarea
                rows={3}
                value={cardMessage}
                onChange={(e) => setCardMessage(e.target.value)}
                placeholder="Escribe tus palabras aquí..."
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#B25E5C]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#2C2825] mb-1">Fecha solicitada</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#A8A199] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#B25E5C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2C2825] mb-1">Ventana de horario</label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-[#A8A199] absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={scheduledTimeWindow}
                    onChange={(e) => setScheduledTimeWindow(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#B25E5C]"
                  >
                    <option value="9:00 AM - 12:00 PM">Mañana (9:00 AM - 12:00 PM)</option>
                    <option value="12:00 PM - 3:00 PM">Mediodía (12:00 PM - 3:00 PM)</option>
                    <option value="3:00 PM - 6:00 PM">Tarde (3:00 PM - 6:00 PM)</option>
                    <option value="6:00 PM - 8:30 PM">Vespertino (6:00 PM - 8:30 PM)</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2C2825] mb-1">Notas especiales u observaciones</label>
              <input
                type="text"
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="ej. Entregar discreto, es sorpresa; llamar antes de llegar"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#B25E5C]"
              />
            </div>
          </div>
        </div>

        {/* Resumen Final de Compra */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] shadow-sm space-y-6 lg:sticky lg:top-24">
          <h2 className="font-serif text-xl font-semibold text-[#2C2825]">
            Resumen de compra
          </h2>

          <div className="space-y-3 text-xs border-b border-[#F2ECE4] pb-4">
            {groupedByFlorist.map((group) => {
              const fee = deliveryMethod === 'delivery' ? group.deliveryFee : 0;
              return (
                <div key={group.florist.id} className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE3D9] space-y-1">
                  <div className="font-semibold text-[#2C2825]">{group.florist.commercialName}</div>
                  <div className="text-[11px] text-[#7A736E]">
                    {group.items.length} artículos · Subtotal: ${group.subtotal.toLocaleString('es-MX')} MXN
                  </div>
                  <div className="text-[11px] text-[#5A735E]">
                    Envío: {deliveryMethod === 'delivery' ? `$${fee} MXN` : 'Sin costo (Recolección)'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-[#2C2825]">Total a liquidar:</span>
            <div className="text-right">
              <span className="text-2xl font-bold text-[#2C2825] tabular-nums">
                ${grandTotal.toLocaleString('es-MX')}
              </span>
              <span className="text-xs text-[#8A8179] ml-1">MXN</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-[#2C2825] hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <CreditCard className="w-4 h-4" />
            <span>{isSubmitting ? 'Preparando pago...' : `Pagar $${grandTotal.toLocaleString('es-MX')} MXN con tarjeta`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[11px] text-[#7A736E] text-center leading-relaxed flex items-start justify-center gap-1.5">
            <Lock className="w-3 h-3 mt-0.5 shrink-0" />
            <span>
              Pago seguro procesado por Stripe. Tras el pago, la florería recibe tu pedido y podrás coordinar la
              entrega por WhatsApp.
            </span>
          </p>
        </div>
      </form>
    </div>
  );
};
