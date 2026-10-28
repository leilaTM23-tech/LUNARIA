import React, { useState, useEffect } from 'react';
import { repository } from '../../services/repository';
import { Florist, Order, Category, Community } from '../../types';
import { TrendingUp, DollarSign, Package, Store, MapPin, Award } from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const [florists, setFlorists] = useState<Florist[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReportData() {
      setLoading(true);
      try {
        const [fls, ords, cats, comms] = await Promise.all([
          repository.getFlorists(),
          repository.getOrders(),
          repository.getCategories(),
          repository.getCommunities(),
        ]);
        setFlorists(fls);
        setOrders(ords);
        setCategories(cats);
        setCommunities(comms);
      } finally {
        setLoading(false);
      }
    }
    loadReportData();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-xs text-[#8A8179]">Generando reportes analíticos...</div>;
  }

  const validOrders = orders.filter((o) => o.status !== 'cancelled');
  const totalGMV = validOrders.reduce((acc, o) => acc + o.totalAmount, 0);
  const averageTicket = validOrders.length > 0 ? Math.round(totalGMV / validOrders.length) : 0;

  // Ventas por florería
  const salesByFlorist = florists.map((f) => {
    const shopOrders = orders.filter((o) => o.floristId === f.id && o.status !== 'cancelled');
    const revenue = shopOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const completed = shopOrders.filter((o) => o.status === 'delivered').length;
    return { florist: f, ordersCount: shopOrders.length, revenue, completed };
  });

  // Ventas por comunidad
  const salesByCommunity = communities.map((comm) => {
    const commOrders = orders.filter((o) => o.deliveryCommunityId === comm.id && o.status !== 'cancelled');
    const revenue = commOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    return { community: comm, count: commOrders.length, revenue };
  }).filter((c) => c.count > 0).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-6 border-b border-[#EAE3D9]">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#8C3D38] mb-1">
          Inteligencia de Negocio
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2C2825]">
          Reportes y Estadísticas Globales
        </h1>
        <p className="text-xs text-[#7A736E] mt-1">
          Rendimiento comercial y métricas de penetración en los municipios del estado de Tlaxcala.
        </p>
      </div>

      {/* KPI resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-[#EAE3D9] shadow-xs space-y-1">
          <div className="text-xs text-[#8A8179]">Volumen Bruto de Ventas (GMV)</div>
          <div className="text-3xl font-bold text-[#2C2825] tabular-nums">
            ${totalGMV.toLocaleString('es-MX')}{' '}
            <span className="text-xs font-normal text-[#8A8179]">MXN</span>
          </div>
          <div className="text-[11px] text-[#5A735E]">Total de pedidos no cancelados</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#EAE3D9] shadow-xs space-y-1">
          <div className="text-xs text-[#8A8179]">Ticket Promedio por Pedido</div>
          <div className="text-3xl font-bold text-[#2C2825] tabular-nums">
            ${averageTicket.toLocaleString('es-MX')}{' '}
            <span className="text-xs font-normal text-[#8A8179]">MXN</span>
          </div>
          <div className="text-[11px] text-[#7A736E]">Incluye flores y tarifa de envío</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#EAE3D9] shadow-xs space-y-1">
          <div className="text-xs text-[#8A8179]">Tasa de Cumplimiento / Entrega</div>
          <div className="text-3xl font-bold text-[#5A735E] tabular-nums">
            {orders.length > 0
              ? `${Math.round(
                  (orders.filter((o) => o.status === 'delivered').length / orders.length) * 100
                )}%`
              : '100%'}
          </div>
          <div className="text-[11px] text-[#7A736E]">Pedidos entregados a satisfacción</div>
        </div>
      </div>

      {/* Tabla 1: Desglose de Ventas por Florería */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-[#8C3D38]" />
          <h2 className="font-serif text-xl font-semibold text-[#2C2825]">
            Rendimiento Comercial por Florería
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#EAE3D9] text-[#8A8179]">
                <th className="py-3 px-4 font-semibold">Florería Local</th>
                <th className="py-3 px-4 font-semibold">Municipio Sede</th>
                <th className="py-3 px-4 font-semibold">Pedidos Despachados</th>
                <th className="py-3 px-4 font-semibold">Pedidos Entregados</th>
                <th className="py-3 px-4 font-semibold text-right">Ventas Totales ($MXN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2ECE4]">
              {salesByFlorist.map(({ florist, ordersCount, revenue, completed }) => (
                <tr key={florist.id} className="hover:bg-[#FAF8F5]">
                  <td className="py-3 px-4 font-semibold text-[#2C2825]">{florist.commercialName}</td>
                  <td className="py-3 px-4 text-[#665E58]">{florist.address}</td>
                  <td className="py-3 px-4 tabular-nums font-medium text-[#2C2825]">{ordersCount}</td>
                  <td className="py-3 px-4 tabular-nums text-[#5A735E] font-medium">{completed}</td>
                  <td className="py-3 px-4 tabular-nums font-bold text-right text-[#2C2825]">
                    ${revenue.toLocaleString('es-MX')} MXN
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla 2: Demanda por Comunidad en Tlaxcala */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#5A735E]" />
          <h2 className="font-serif text-xl font-semibold text-[#2C2825]">
            Demanda por Comunidad y Municipio de Entrega
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {salesByCommunity.map(({ community, count, revenue }) => (
            <div
              key={community.id}
              className="p-4 rounded-2xl border border-[#EAE3D9] bg-[#FAF8F5] flex items-center justify-between"
            >
              <div>
                <div className="font-semibold text-xs text-[#2C2825]">{community.name}</div>
                <div className="text-[11px] text-[#7A736E]">{community.municipality} · {count} entregas realizadas</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-[#2C2825] tabular-nums">
                  ${revenue.toLocaleString('es-MX')} MXN
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
