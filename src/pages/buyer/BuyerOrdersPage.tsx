import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { repository } from '../../services/repository';
import { Order } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { generateWhatsAppOrderUrl } from '../../utils/whatsapp';
import {
  Package,
  Calendar,
  MessageCircle,
  ArrowRight,
  ExternalLink,
  Store,
} from 'lucide-react';

export const BuyerOrdersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBuyerOrders() {
      setLoading(true);
      try {
        const list = await repository.getOrders({ buyerId: currentUser.id });
        setOrders(list);
      } finally {
        setLoading(false);
      }
    }
    loadBuyerOrders();
  }, [currentUser.id]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-6 border-b border-[#EAE3D9]">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#B25E5C] mb-1">
          Historial de compras
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2C2825]">
          Mis Pedidos Florales
        </h1>
        <p className="text-xs text-[#7A736E] mt-1">
          Consulta el estado en tiempo real de tus pedidos y contacta a las florerías encargadas.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[#8A8179]">Cargando tus pedidos...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE3D9] space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF0ED] text-[#B25E5C] flex items-center justify-center">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-[#2C2825]">Aún no tienes pedidos</h2>
          <p className="text-xs text-[#7A736E]">
            Cuando elijas flores para esa persona especial, tus órdenes aparecerán aquí con su seguimiento.
          </p>
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#2C2825] text-white text-xs font-semibold rounded-xl hover:bg-black transition-colors"
          >
            <span>Ver catálogo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const waUrl = generateWhatsAppOrderUrl(order);
            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-6 border border-[#EAE3D9] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#B25E5C] transition-colors"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-bold text-sm text-[#2C2825]">#{order.id}</span>
                    <StatusBadge status={order.status} />
                    <span className="text-xs text-[#8A8179] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#5C534E]">
                    <Store className="w-4 h-4 text-[#5A735E]" />
                    <span className="font-semibold text-[#2C2825]">{order.floristName}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {order.deliveryMethod === 'delivery'
                        ? `Entrega en ${order.deliveryCommunityName}`
                        : 'Recolección en taller'}
                    </span>
                  </div>

                  {/* Lista resumida de artículos */}
                  <div className="flex flex-wrap gap-2 text-xs text-[#665E58]">
                    {order.items.map((it) => (
                      <span key={it.id} className="bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#EAE3D9]">
                        {it.quantity}x {it.productTitle}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-[#F2ECE4]">
                  <div>
                    <div className="text-[11px] text-[#8A8179] md:text-right">Total del pedido:</div>
                    <div className="text-xl font-bold text-[#2C2825] tabular-nums md:text-right">
                      ${order.totalAmount.toLocaleString('es-MX')} MXN
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Abrir WhatsApp con la florería"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <Link
                      to={`/comprador/pedido/${order.id}`}
                      className="px-4 py-2 bg-[#FAF8F5] border border-[#EAE3D9] hover:bg-[#F2ECE4] text-xs font-semibold text-[#2C2825] rounded-xl transition-colors"
                    >
                      Ver detalle
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
