import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { repository } from '../../services/repository';
import { Order, OrderStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { generateWhatsAppOrderUrl } from '../../utils/whatsapp';
import {
  Package,
  Calendar,
  MessageCircle,
  Truck,
  ExternalLink,
  Filter,
  CheckCircle2,
} from 'lucide-react';

export const VendorOrdersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const floristId = currentUser.floristId || 'flor-1';

  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Modal de actualización con nota
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [targetStatus, setTargetStatus] = useState<OrderStatus>('confirmed_by_vendor');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      try {
        const list = await repository.getOrders({ floristId });
        setOrders(list);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [floristId]);

  const handleOpenStatusModal = (order: Order) => {
    setActiveOrder(order);
    setTargetStatus(order.status);
    setStatusNote('');
  };

  const handleApplyStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

    setIsUpdating(true);
    try {
      const updated = await repository.updateOrderStatus(
        activeOrder.id,
        targetStatus,
        `${currentUser.fullName} (Florería)`,
        statusNote.trim() || undefined
      );

      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setActiveOrder(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#EAE3D9] gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#5A735E] mb-1">
            Recepción de Pedidos
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2C2825]">
            Pedidos Recibidos ({filteredOrders.length})
          </h1>
          <p className="text-xs text-[#7A736E] mt-1">
            Supervisa órdenes de compradores locales y avanza los estados según el flujo de tu taller.
          </p>
        </div>

        {/* Filtro por estado */}
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#EAE3D9] text-xs self-start sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-[#5A735E]" />
          <span className="text-[#8A8179]">Estado:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="font-semibold text-[#2C2825] bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="pending_contact">Pendiente de contacto</option>
            <option value="contacted">Contactado</option>
            <option value="confirmed_by_vendor">Confirmado</option>
            <option value="in_preparation">En preparación</option>
            <option value="on_the_way">En camino</option>
            <option value="delivered">Entregado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[#8A8179]">Cargando pedidos...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE3D9] max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#FAF8F5] text-[#8A8179] flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-xl font-semibold text-[#2C2825]">No hay pedidos con este filtro</h3>
          <p className="text-xs text-[#7A736E]">
            Cambia el filtro de estado o aguarda a que nuevos compradores generen solicitudes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const waUrl = generateWhatsAppOrderUrl(order);
            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-6 border border-[#EAE3D9] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="font-bold text-sm text-[#2C2825]">#{order.id}</span>
                    <StatusBadge status={order.status} />
                    <span className="text-xs text-[#8A8179] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="text-xs text-[#665E58]">
                    <strong>Comprador:</strong> {order.buyerName} · Tel: {order.buyerPhone} ({order.buyerEmail})
                  </div>

                  {/* Productos */}
                  <div className="flex flex-wrap gap-2 text-xs text-[#665E58]">
                    {order.items.map((it) => (
                      <span key={it.id} className="bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#EAE3D9]">
                        {it.quantity}x {it.productTitle} (${it.subtotal.toLocaleString('es-MX')} MXN)
                      </span>
                    ))}
                  </div>

                  {/* Detalles de entrega y dedicatoria */}
                  <div className="text-xs text-[#7A736E] space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#5A735E]" />
                      <span>
                        {order.deliveryMethod === 'delivery'
                          ? `Entrega a domicilio en ${order.deliveryCommunityName}${
                              order.deliveryAddress ? ` (${order.deliveryAddress.street} #${order.deliveryAddress.exteriorNumber})` : ''
                            }`
                          : 'Recolección en mostrador del taller'}
                      </span>
                    </div>

                    {order.cardMessage && (
                      <div className="italic text-[#8C3D38] bg-[#FDF4F2] p-2 rounded-lg border border-[#ECCECE]">
                        💌 Tarjeta: &ldquo;{order.cardMessage}&rdquo;
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-[#F2ECE4]">
                  <div>
                    <div className="text-[11px] text-[#8A8179] md:text-right">Total a cobrar:</div>
                    <div className="text-xl font-bold text-[#2C2825] tabular-nums md:text-right">
                      ${order.totalAmount.toLocaleString('es-MX')} MXN
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Contactar al comprador por WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      onClick={() => handleOpenStatusModal(order)}
                      className="px-3.5 py-2 bg-[#2C2825] text-white hover:bg-black text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Actualizar estado
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para actualizar estado del pedido con nota */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-[#EAE3D9] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D9]">
              <h3 className="font-serif text-xl font-semibold text-[#2C2825]">
                Actualizar Estado · #{activeOrder.id}
              </h3>
              <button
                onClick={() => setActiveOrder(null)}
                className="text-slate-400 hover:text-slate-700 text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyStatusChange} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#2C2825] mb-1">
                  Nuevo estado del pedido:
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#5A735E]"
                >
                  <option value="pending_contact">Pendiente de contacto</option>
                  <option value="contacted">Contactado (Cliente escribió por WhatsApp)</option>
                  <option value="confirmed_by_vendor">Confirmado por vendedor (Pago acordado)</option>
                  <option value="in_preparation">En preparación (Florista armando el ramo)</option>
                  <option value="on_the_way">En camino (Repartidor en ruta o listo en mostrador)</option>
                  <option value="delivered">Entregado con éxito</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#2C2825] mb-1">
                  Nota interna o mensaje de avance (opcional):
                </label>
                <textarea
                  rows={2}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="ej. Transferencia BBVA recibida; ramo en camino con repartidor Pedro."
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#5A735E]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveOrder(null)}
                  className="px-3.5 py-2 text-xs text-[#7A736E] hover:text-[#2C2825]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-[#5A735E] hover:bg-[#495e4d] text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  {isUpdating ? 'Actualizando...' : 'Guardar estado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
