import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { repository } from '../../services/repository';
import { Florist, Order, Profile } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  ShieldCheck,
  DollarSign,
  Package,
  Store,
  Users,
  MapPin,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [florists, setFlorists] = useState<Florist[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminMetrics() {
      setLoading(true);
      try {
        const [fls, ords, profs] = await Promise.all([
          repository.getFlorists(),
          repository.getOrders(),
          repository.getProfiles(),
        ]);
        setFlorists(fls);
        setOrders(ords);
        setUsers(profs);
      } finally {
        setLoading(false);
      }
    }
    loadAdminMetrics();
  }, []);

  const totalGMV = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((acc, o) => acc + o.totalAmount, 0);

  const pendingFloristsCount = florists.filter(
    (f) => f.status === 'pending_review' || f.status === 'info_required' || f.status === 'draft'
  ).length;

  if (loading) {
    return <div className="py-20 text-center text-xs text-[#8A8179]">Cargando panel de administración...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Encabezado */}
      <div className="pb-6 border-b border-[#EAE3D9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8C3D38]">
              Administración Central
            </span>
            <span className="text-[10px] bg-[#FAF0ED] text-[#8C3D38] font-bold px-2 py-0.5 rounded border border-[#ECCECE]">
              Supervisión Lunaria Tlaxcala
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2C2825] mt-1">
            Dashboard Administrativo
          </h1>
          <p className="text-xs text-[#7A736E] mt-0.5">
            Supervisa todas las florerías colaboradoras, pedidos activos, zonas de cobertura y usuarios registrados.
          </p>
        </div>

        <Link
          to="/admin/florerias"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#2C2825] hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Store className="w-4 h-4" />
          <span>Gestionar Florerías ({florists.length})</span>
        </Link>
      </div>

      {/* KPI Cards Globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#EAE3D9] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#8A8179]">
            <span className="text-xs font-medium">Volumen Total (GMV)</span>
            <DollarSign className="w-4 h-4 text-[#5A735E]" />
          </div>
          <div className="text-2xl font-bold text-[#2C2825] tabular-nums">
            ${totalGMV.toLocaleString('es-MX')}{' '}
            <span className="text-xs font-normal text-[#8A8179]">MXN</span>
          </div>
          <div className="text-[11px] text-[#5A735E] font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Transacciones en el estado de Tlaxcala</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE3D9] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#8A8179]">
            <span className="text-xs font-medium">Pedidos Totales</span>
            <Package className="w-4 h-4 text-[#B25E5C]" />
          </div>
          <div className="text-2xl font-bold text-[#2C2825] tabular-nums">{orders.length}</div>
          <div className="text-[11px] text-[#8A8179]">
            {orders.filter((o) => o.status === 'delivered').length} completados exitosamente
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE3D9] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#8A8179]">
            <span className="text-xs font-medium">Florerías en Red</span>
            <Store className="w-4 h-4 text-[#5A735E]" />
          </div>
          <div className="text-2xl font-bold text-[#2C2825] tabular-nums">{florists.length}</div>
          <div className="text-[11px] text-[#8A8179]">
            {pendingFloristsCount > 0 ? (
              <span className="text-amber-700 font-semibold">{pendingFloristsCount} pendientes de aprobación</span>
            ) : (
              'Todas las florerías aprobadas'
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE3D9] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#8A8179]">
            <span className="text-xs font-medium">Usuarios Registrados</span>
            <Users className="w-4 h-4 text-[#8C3D38]" />
          </div>
          <div className="text-2xl font-bold text-[#2C2825] tabular-nums">{users.length}</div>
          <div className="text-[11px] text-[#8A8179]">
            {users.filter((u) => u.role === 'buyer').length} compradores activos
          </div>
        </div>
      </div>

      {/* Módulos de Acceso Rápido para Administración */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        {[
          { label: 'Florerías', path: '/admin/florerias', icon: Store, desc: 'Aprobar/suspender' },
          { label: 'Usuarios', path: '/admin/usuarios', icon: Users, desc: 'Compradores y roles' },
          { label: 'Comunidades', path: '/admin/comunidades', icon: MapPin, desc: 'Zonas y municipios' },
          { label: 'Catálogo', path: '/admin/catalogo', icon: Sparkles, desc: 'Categorías y maestros' },
          { label: 'Pedidos', path: '/admin/pedidos', icon: Package, desc: 'Supervisión global' },
          { label: 'Reportes', path: '/admin/reportes', icon: TrendingUp, desc: 'Estadísticas Tlaxcala' },
        ].map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="p-4 bg-white rounded-2xl border border-[#EAE3D9] hover:border-[#8C3D38] transition-all flex flex-col justify-between group shadow-xs"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-[#FAF0ED] text-[#8C3D38] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <item.icon className="w-4 h-4" />
              </div>
              <div className="font-semibold text-xs text-[#2C2825]">{item.label}</div>
              <div className="text-[10px] text-[#8A8179] mt-0.5">{item.desc}</div>
            </div>
            <div className="mt-3 text-[11px] font-semibold text-[#8C3D38] flex items-center gap-1">
              <span>Abrir</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>

      {/* Resumen de Actividad de Florerías de Tlaxcala */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#F2ECE4]">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#2C2825]">
              Actividad Global de Florerías Colaboradoras
            </h2>
            <p className="text-xs text-[#7A736E] mt-0.5">
              Estado de los talleres florales registrados y pedidos despachados.
            </p>
          </div>
          <Link to="/admin/florerias" className="text-xs font-semibold text-[#8C3D38] hover:underline">
            Ver todas →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {florists.map((f) => {
            const shopOrders = orders.filter((o) => o.floristId === f.id);
            const shopRevenue = shopOrders
              .filter((o) => o.status !== 'cancelled')
              .reduce((acc, o) => acc + o.totalAmount, 0);

            return (
              <div key={f.id} className="p-5 rounded-2xl border border-[#EAE3D9] bg-[#FAF8F5] space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif text-base font-semibold text-[#2C2825]">{f.commercialName}</h3>
                    <div className="text-[11px] text-[#7A736E]">{f.address}</div>
                  </div>
                  {f.status === 'approved' ? (
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                      Activa
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200">
                      Pendiente
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#EAE3D9]">
                  <div>
                    <span className="text-[11px] text-[#8A8179] block">Ventas acumuladas</span>
                    <span className="font-bold tabular-nums text-[#2C2825]">
                      ${shopRevenue.toLocaleString('es-MX')} MXN
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#8A8179] block">Pedidos totales</span>
                    <span className="font-bold tabular-nums text-[#2C2825]">{shopOrders.length}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Link
                    to={`/admin/pedidos?floristId=${f.id}`}
                    className="text-xs text-[#8C3D38] font-semibold hover:underline"
                  >
                    Supervisar pedidos →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
