import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { repository } from '../../services/repository';
import { Order, Florist, OrderStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Package, Filter, Calendar, Store, User, Search } from 'lucide-react';

export const AdminOrdersPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [florists, setFlorists] = useState<Florist[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedFloristId, setSelectedFloristId] = useState<string>(
    searchParams.get('floristId') || 'all'
  );
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      try {
        const [allOrders, allFlorists] = await Promise.all([
          repository.getOrders(),
          repository.getFlorists(),
        ]);
        setOrders(allOrders);
        setFlorists(allFlorists);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (selectedFloristId !== 'all' && o.floristId !== selectedFloristId) return false;
    if (selectedStatus !== 'all' && o.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = o.id.toLowerCase().includes(q);
      const matchBuyer = o.buyerName.toLowerCase().includes(q);
      const matchFlorist = o.floristName.toLowerCase().includes(q);
      if (!matchId && !matchBuyer && !matchFlorist) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-6 border-b border-[#EAE3D9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#8C3D38] mb-1">
            Supervisión Transaccional
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2C2825]">
            Supervisión General de Pedidos ({filteredOrders.length})
          </h1>
          <p className="text-xs text-[#7A736E] mt-1">
            Monitorea el cumplimiento de las órdenes generadas en todas las florerías del estado de Tlaxcala.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#A8A199] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por ID o cliente..."
              className="pl-8 pr-3 py-2 bg-white border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none"
            />
          </div>

          <select
            value={selectedFloristId}
            onChange={(e) => setSelectedFloristId(e.target.value)}
            className="px-3 py-2 bg-white border border-[#EAE3D9] rounded-xl text-xs font-semibold text-[#2C2825] focus:outline-none"
          >
            <option value="all">Todas las florerías</option>
            {florists.map((f) => (
              <option key={f.id} value={f.id}>
                {f.commercialName}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-[#EAE3D9] rounded-xl text-xs font-semibold text-[#2C2825] focus:outline-none"
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
          <Package className="w-8 h-8 text-[#8A8179] mx-auto" />
          <h3 className="font-serif text-lg font-semibold text-[#2C2825]">Sin pedidos con estos criterios</h3>
          <p className="text-xs text-[#7A736E]">Intenta ajustar los filtros de florería o estado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#EAE3D9] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#EAE3D9] bg-[#FAF8F5] text-[#8A8179]">
                  <th className="py-3 px-4 font-semibold">ID / Fecha</th>
                  <th className="py-3 px-4 font-semibold">Florería Asignada</th>
                  <th className="py-3 px-4 font-semibold">Comprador</th>
                  <th className="py-3 px-4 font-semibold">Detalle de Flores</th>
                  <th className="py-3 px-4 font-semibold">Total ($MXN)</th>
                  <th className="py-3 px-4 font-semibold">Estado Actual</th>
                  <th className="py-3 px-4 font-semibold">Destino Tlaxcala</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE4]">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FAF8F5]">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#2C2825]">#{order.id}</div>
                      <div className="text-[11px] text-[#8A8179]">
                        {new Date(order.createdAt).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-[#5A735E]">
                      {order.floristName}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-[#2C2825]">{order.buyerName}</div>
                      <div className="text-[11px] text-[#7A736E]">{order.buyerPhone}</div>
                    </td>

                    <td className="py-3 px-4 text-[#665E58]">
                      {order.items.map((i) => `${i.quantity}x ${i.productTitle}`).join(', ')}
                    </td>

                    <td className="py-3 px-4 font-bold tabular-nums text-[#2C2825]">
                      ${order.totalAmount.toLocaleString('es-MX')}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={order.status} />
                    </td>

                    <td className="py-3 px-4 text-[#7A736E]">
                      {order.deliveryMethod === 'delivery'
                        ? `${order.deliveryCommunityName}`
                        : 'Recolección taller'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
