import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Order } from '../../types';
import { getPaymentResult, startOnlinePayment } from '../../services/payments';
import { generateWhatsAppOrderUrl } from '../../utils/whatsapp';
import {
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  MessageCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';

/**
 * Página de regreso desde Stripe Checkout (/checkout/pago).
 *  - ?session_id=cs_...           → pago completado (o en proceso)
 *  - ?cancelado=1&pedidos=LUN-...  → el comprador canceló en Stripe
 */
export const PaymentResultPage: React.FC = () => {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const cancelled = params.get('cancelado') === '1';
  const pendingIds = (params.get('pedidos') || '').split(',').filter(Boolean);

  const [loading, setLoading] = useState(!!sessionId);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [amountTotal, setAmountTotal] = useState(0);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    getPaymentResult(sessionId)
      .then((result) => {
        setPaid(result.paymentStatus === 'paid');
        setOrders(result.orders);
        setAmountTotal(result.amountTotal);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const retryPayment = async (ids: string[]) => {
    setRetrying(true);
    setError(null);
    try {
      await startOnlinePayment(ids);
    } catch (err: any) {
      setError(err.message);
      setRetrying(false);
    }
  };

  const shell = (children: React.ReactNode) => (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">{children}</div>
  );

  // --- Cargando verificación con Stripe
  if (loading) {
    return shell(
      <div className="text-center py-16 space-y-3">
        <Loader2 className="w-8 h-8 mx-auto text-[#B25E5C] animate-spin" />
        <p className="text-xs text-[#7A736E]">Verificando tu pago con Stripe…</p>
      </div>
    );
  }

  // --- El comprador canceló en la pantalla de Stripe
  if (cancelled || (!sessionId && pendingIds.length > 0)) {
    return shell(
      <div className="text-center space-y-4 bg-white p-8 rounded-3xl border border-[#EAE3D9] shadow-sm">
        <XCircle className="w-12 h-12 mx-auto text-rose-600" />
        <h1 className="font-serif text-2xl font-semibold text-[#2C2825]">Pago cancelado</h1>
        <p className="text-xs text-[#665E58] max-w-md mx-auto leading-relaxed">
          No se realizó ningún cargo. Tus pedidos ({pendingIds.map((id) => `#${id}`).join(', ')}) quedaron
          guardados como <strong>esperando pago</strong>; la florería no los recibirá hasta que pagues.
        </p>
        {error && <p className="text-[11px] text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3">{error}</p>}
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            type="button"
            disabled={retrying || pendingIds.length === 0}
            onClick={() => retryPayment(pendingIds)}
            className="px-5 py-2.5 bg-[#2C2825] hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CreditCard className="w-4 h-4" />
            {retrying ? 'Abriendo Stripe...' : 'Intentar pagar de nuevo'}
          </button>
          <Link to="/comprador/pedidos" className="text-xs text-[#B25E5C] font-semibold hover:underline">
            Ver mis pedidos
          </Link>
        </div>
      </div>
    );
  }

  // --- Error consultando la sesión, o se llegó sin parámetros
  if (error || !sessionId) {
    return shell(
      <div className="text-center space-y-3 bg-white p-8 rounded-3xl border border-[#EAE3D9]">
        <XCircle className="w-10 h-10 mx-auto text-rose-600" />
        <h1 className="font-serif text-2xl font-semibold text-[#2C2825]">No pudimos verificar el pago</h1>
        <p className="text-xs text-[#665E58]">{error || 'No se indicó una sesión de pago.'}</p>
        <Link to="/comprador/pedidos" className="inline-block text-xs text-[#B25E5C] font-semibold hover:underline">
          Revisar mis pedidos
        </Link>
      </div>
    );
  }

  // --- Sesión válida pero el pago aún no se acredita (ej. métodos asíncronos)
  if (!paid) {
    return shell(
      <div className="text-center space-y-3 bg-white p-8 rounded-3xl border border-[#EAE3D9]">
        <Clock className="w-10 h-10 mx-auto text-amber-600" />
        <h1 className="font-serif text-2xl font-semibold text-[#2C2825]">Pago en proceso</h1>
        <p className="text-xs text-[#665E58] max-w-md mx-auto">
          Stripe aún no confirma el pago. En cuanto se acredite, tus pedidos pasarán a la florería.
        </p>
        <Link to="/comprador/pedidos" className="inline-block text-xs text-[#B25E5C] font-semibold hover:underline">
          Ver mis pedidos
        </Link>
      </div>
    );
  }

  // --- Pago exitoso
  return shell(
    <>
      <div className="text-center space-y-3 bg-white p-8 rounded-3xl border border-[#EAE3D9] shadow-sm">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#EEF3EE] text-[#5A735E] flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-[#2C2825]">¡Pago realizado con éxito!</h1>
        <p className="text-xs text-[#665E58] max-w-lg mx-auto leading-relaxed">
          Pagaste <strong>${amountTotal.toLocaleString('es-MX')} MXN</strong>.{' '}
          {orders.length === 1 ? 'Tu pedido ya fue enviado' : `Tus ${orders.length} pedidos ya fueron enviados`} a la
          florería. Usa WhatsApp para coordinar los detalles de la entrega.
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl p-6 border border-[#EAE3D9] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F2ECE4] gap-2">
              <div>
                <span className="text-xs font-bold text-[#8C3D38]">Pedido #{order.id}</span>
                <h3 className="font-serif text-lg font-semibold text-[#2C2825]">{order.floristName}</h3>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#5A735E] font-semibold">Pagado</div>
                <div className="text-lg font-bold text-[#2C2825] tabular-nums">
                  ${order.totalAmount.toLocaleString('es-MX')} MXN
                </div>
              </div>
            </div>

            <ul className="list-disc list-inside text-xs text-[#7A736E] space-y-0.5">
              {order.items.map((i) => (
                <li key={i.id}>
                  {i.quantity}x {i.productTitle} (${i.subtotal.toLocaleString('es-MX')} MXN)
                </li>
              ))}
            </ul>

            <div className="pt-3 border-t border-[#F2ECE4] flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link to={`/comprador/pedido/${order.id}`} className="text-[11px] text-[#B25E5C] font-semibold hover:underline">
                Ver detalle y seguimiento
              </Link>
              <a
                href={generateWhatsAppOrderUrl(order)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Coordinar entrega con {order.floristName}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center pt-2 flex items-center justify-center gap-4">
        <Link
          to="/comprador/pedidos"
          className="px-6 py-2.5 bg-[#2C2825] text-white text-xs font-semibold rounded-xl hover:bg-black transition-colors"
        >
          Ver mis pedidos
        </Link>
        <Link to="/catalogo" className="text-xs text-[#B25E5C] font-semibold hover:underline">
          Seguir explorando
        </Link>
      </div>
    </>
  );
};
