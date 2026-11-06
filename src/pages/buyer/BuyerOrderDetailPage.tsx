import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { repository } from '../../services/repository';
import { Order } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { generateWhatsAppOrderUrl } from '../../utils/whatsapp';
import {
  ChevronRight,
  Store,
  MapPin,
  Calendar,
  Clock,
  Heart,
  MessageCircle,
  ExternalLink,
  Truck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const BuyerOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      if (!id) return;
      setLoading(true);
      try {
        const found = await repository.getOrderById(id);
        setOrder(found);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!order) return;
    if (window.confirm('¿Seguro que deseas cancelar este pedido? Se notificará a la florería.')) {
      setCancelling(true);
      try {
        const updated = await repository.updateOrderStatus(
          order.id,
          'cancelled',
          'Comprador (Plataforma)',
          'El comprador canceló la solicitud.'
        );
        setOrder(updated);
      } finally {
        setCancelling(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-[#8A8179]">
        Cargando detalle de tu pedido...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-3">
        <h2 className="font-serif text-2xl font-semibold text-[#2C2825]">Pedido no encontrado</h2>
        <p className="text-xs text-[#7A736E]">No localizamos ningún pedido con el número solicitado.</p>
        <Link to="/comprador/pedidos" className="inline-block px-4 py-2 bg-[#2C2825] text-white rounded-lg text-xs font-semibold">
          Volver a mis pedidos
        </Link>
      </div>
    );
  }

  const waUrl = generateWhatsAppOrderUrl(order);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-[#8A8179]">
        <Link to="/" className="hover:text-[#2C2825]">Inicio</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/comprador/pedidos" className="hover:text-[#2C2825]">Mis Pedidos</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#2C2825] font-medium">Pedido #{order.id}</span>
      </nav>

      {/* Encabezado del pedido */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#2C2825]">
              Pedido #{order.id}
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-[#7A736E]">
            Creado el {new Date(order.createdAt).toLocaleDateString('es-MX', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {/* Acciones WhatsApp y cancelación */}
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Hablar por WhatsApp con {order.floristName}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {(order.status === 'pending_contact' || order.status === 'contacted') && (
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="px-4 py-2.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs font-semibold border border-rose-200 transition-colors cursor-pointer"
            >
              {cancelling ? 'Cancelando...' : 'Cancelar pedido'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Artículos y Notas */}
        <div className="lg:col-span-7 space-y-6">
          {/* Productos comprados */}
          <div className="bg-white rounded-3xl p-6 border border-[#EAE3D9] shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-semibold text-[#2C2825]">
              Artículos del pedido
            </h3>

            <div className="divide-y divide-[#F2ECE4]">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center gap-4">
                  <img
                    src={item.productImage}
                    alt={item.productTitle}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover bg-[#FAF8F5] border border-[#EAE3D9] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-xs sm:text-sm text-[#2C2825]">{item.productTitle}</h4>
                    <div className="text-[11px] text-[#8A8179] mt-0.5">
                      {item.quantity} x ${item.unitPrice.toLocaleString('es-MX')} MXN
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-semibold text-sm text-[#2C2825] tabular-nums">
                      ${item.subtotal.toLocaleString('es-MX')} MXN
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotales */}
            <div className="pt-4 border-t border-[#F2ECE4] space-y-2 text-xs">
              <div className="flex justify-between text-[#665E58]">
                <span>Subtotal de flores:</span>
                <span className="tabular-nums font-semibold text-[#2C2825]">
                  ${(order.totalAmount - order.deliveryFee).toLocaleString('es-MX')} MXN
                </span>
              </div>
              <div className="flex justify-between text-[#665E58]">
                <span>Costo de envío:</span>
                <span className="tabular-nums font-semibold text-[#2C2825]">
                  {order.deliveryFee > 0 ? `$${order.deliveryFee} MXN` : 'Sin costo (Recolección)'}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#2C2825] pt-2 border-t border-[#F2ECE4]">
                <span>Total liquidado / acordado:</span>
                <span className="tabular-nums text-lg text-[#B25E5C]">
                  ${order.totalAmount.toLocaleString('es-MX')} MXN
                </span>
              </div>
            </div>
          </div>

          {/* Dedicatoria en la tarjeta */}
          {order.cardMessage && (
            <div className="bg-[#FAF6F2] rounded-3xl p-6 border border-[#EAE3D9] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#8C3D38]">
                <Heart className="w-4 h-4 text-[#B25E5C]" />
                <span>Dedicatoria para la tarjeta de regalo:</span>
              </div>
              <p className="text-xs italic text-[#5C534E] bg-white p-3.5 rounded-xl border border-[#EAE3D9] leading-relaxed">
                &ldquo;{order.cardMessage}&rdquo;
              </p>
            </div>
          )}

          {/* Observaciones */}
          {order.specialNotes && (
            <div className="bg-white rounded-3xl p-5 border border-[#EAE3D9] text-xs text-[#665E58] space-y-1">
              <span className="font-semibold text-[#2C2825]">Observaciones de entrega:</span>
              <p className="text-[#7A736E]">{order.specialNotes}</p>
            </div>
          )}
        </div>

        {/* Columna Derecha: Seguimiento e Info de Florería */}
        <div className="lg:col-span-5 space-y-6">
          {/* Datos de Florería y Entrega */}
          <div className="bg-white rounded-3xl p-6 border border-[#EAE3D9] shadow-xs space-y-4 text-xs">
            <h3 className="font-serif text-lg font-semibold text-[#2C2825] flex items-center gap-2">
              <Store className="w-4 h-4 text-[#5A735E]" />
              <span>Florería encargada</span>
            </h3>

            <div className="space-y-1.5 text-[#665E58]">
              <div className="font-semibold text-sm text-[#2C2825]">{order.floristName}</div>
              <div className="text-[11px] text-[#7A736E]">Teléfono: {order.floristPhone}</div>
              <div className="text-[11px] text-[#7A736E]">WhatsApp: +{order.floristWhatsapp}</div>
            </div>

            <div className="pt-3 border-t border-[#F2ECE4] space-y-2">
              <div className="font-semibold text-[#2C2825] flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#B25E5C]" />
                <span>
                  {order.deliveryMethod === 'delivery' ? 'Entrega a domicilio' : 'Recolección en tienda'}
                </span>
              </div>

              {order.deliveryMethod === 'delivery' && order.deliveryAddress ? (
                <div className="text-[#665E58] space-y-0.5">
                  <div>
                    {order.deliveryAddress.street} #{order.deliveryAddress.exteriorNumber}
                  </div>
                  <div>Col. {order.deliveryAddress.neighborhood}, {order.deliveryCommunityName}</div>
                  {order.deliveryAddress.reference && (
                    <div className="text-[11px] text-[#8A8179] italic">
                      Ref: {order.deliveryAddress.reference}
                    </div>
                  )}
                  <div className="text-[11px] text-[#8A8179]">
                    Recibe: {order.deliveryAddress.recipientName} ({order.deliveryAddress.recipientPhone})
                  </div>
                </div>
              ) : (
                <div className="text-[#665E58]">
                  Pasa a recoger directamente en el taller de {order.floristName}.
                </div>
              )}

              {order.scheduledDate && (
                <div className="pt-2 flex items-center gap-2 text-[#5A735E] font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Fecha: {order.scheduledDate} {order.scheduledTimeWindow && `(${order.scheduledTimeWindow})`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Historial y línea de tiempo del estado */}
          <div className="bg-white rounded-3xl p-6 border border-[#EAE3D9] shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-semibold text-[#2C2825] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#B25E5C]" />
              <span>Historial del pedido</span>
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EAE3D9]">
              {order.statusHistory.map((step, idx) => (
                <div key={idx} className="relative text-xs">
                  <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-white border-2 border-[#B25E5C] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#B25E5C]" />
                  </div>
                  <div className="font-semibold text-[#2C2825]">
                    <StatusBadge status={step.status} />
                  </div>
                  <div className="text-[11px] text-[#8A8179] mt-0.5">
                    {new Date(step.timestamp).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    · {step.changedBy}
                  </div>
                  {step.note && (
                    <p className="text-[11px] text-[#665E58] mt-1 bg-[#FAF8F5] p-2 rounded-lg border border-[#EAE3D9]">
                      {step.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
