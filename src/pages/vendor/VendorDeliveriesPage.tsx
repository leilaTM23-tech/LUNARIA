import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { repository } from '../../services/repository';
import { Florist, DeliveryZoneRule } from '../../types';
import { Truck, Plus, Trash2, Check, Save, MapPin } from 'lucide-react';

export const VendorDeliveriesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { communities, refreshMarketplaceData } = useMarketplace();
  const floristId = currentUser.floristId || 'flor-1';

  const [florist, setFlorist] = useState<Florist | null>(null);
  const [zones, setZones] = useState<DeliveryZoneRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Nueva zona
  const [newCommunityId, setNewCommunityId] = useState(communities[0]?.id || 'com-tlaxcala-centro');
  const [newDeliveryFee, setNewDeliveryFee] = useState(50);
  const [newEstimatedTime, setNewEstimatedTime] = useState('1 a 2.5 horas');
  const [newMinOrder, setNewMinOrder] = useState(300);

  useEffect(() => {
    async function loadZones() {
      setLoading(true);
      try {
        const fl = await repository.getFloristById(floristId);
        if (fl) {
          setFlorist(fl);
          setZones(fl.deliveryZones || []);
        }
      } finally {
        setLoading(false);
      }
    }
    loadZones();
  }, [floristId]);

  const handleAddZone = () => {
    if (!newCommunityId) return;

    // Verificar si ya existe
    if (zones.some((z) => z.communityId === newCommunityId)) {
      alert('Esta comunidad ya está configurada en tus zonas de entrega. Modifica su tarifa en la tabla.');
      return;
    }

    const newZone: DeliveryZoneRule = {
      id: `dz-${Date.now()}`,
      floristId,
      communityId: newCommunityId,
      deliveryFee: Number(newDeliveryFee),
      estimatedDeliveryTime: newEstimatedTime,
      minOrderAmount: Number(newMinOrder),
      isActive: true,
    };

    setZones([...zones, newZone]);
  };

  const handleToggleZone = (id: string) => {
    setZones(zones.map((z) => (z.id === id ? { ...z, isActive: !z.isActive } : z)));
  };

  const handleRemoveZone = (id: string) => {
    setZones(zones.filter((z) => z.id !== id));
  };

  const handleSaveAllZones = async () => {
    if (!florist) return;
    setIsSaving(true);
    try {
      await repository.updateDeliveryZones(florist.id, zones);
      await refreshMarketplaceData();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !florist) {
    return <div className="py-20 text-center text-xs text-[#8A8179]">Cargando zonas de entrega...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-6 border-b border-[#EAE3D9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#5A735E] mb-1">
            Logística y Cobertura
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2C2825]">
            Configuración de Entregas y Tarifas
          </h1>
          <p className="text-xs text-[#7A736E] mt-1">
            Establece en qué municipios de Tlaxcala entregas flores, el costo por viaje y el tiempo aproximado.
          </p>
        </div>

        <button
          onClick={handleSaveAllZones}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2C2825] hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Guardando...' : 'Guardar cambios'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Zonas de entrega y tarifas actualizadas con éxito.</span>
        </div>
      )}

      {/* Agregar Nueva Zona */}
      <div className="bg-white rounded-3xl p-6 border border-[#EAE3D9] shadow-xs space-y-4">
        <h3 className="font-serif text-lg font-semibold text-[#2C2825] flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#5A735E]" />
          <span>Añadir nueva comunidad a tu cobertura</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#2C2825] mb-1">Comunidad / Municipio</label>
            <select
              value={newCommunityId}
              onChange={(e) => setNewCommunityId(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825]"
            >
              {communities
                .filter((c) => c.isActive)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.municipality})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2C2825] mb-1">Tarifa de envío ($MXN)</label>
            <input
              type="number"
              min={0}
              step={5}
              value={newDeliveryFee}
              onChange={(e) => setNewDeliveryFee(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2C2825] mb-1">Tiempo estimado de ruta</label>
            <input
              type="text"
              value={newEstimatedTime}
              onChange={(e) => setNewEstimatedTime(e.target.value)}
              placeholder="ej. 1 a 2 horas"
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2C2825] mb-1">Pedido mínimo ($MXN)</label>
            <input
              type="number"
              min={0}
              step={50}
              value={newMinOrder}
              onChange={(e) => setNewMinOrder(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825]"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleAddZone}
            className="px-5 py-2 bg-[#5A735E] hover:bg-[#495e4d] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Agregar zona
          </button>
        </div>
      </div>

      {/* Tabla de Zonas Activas */}
      <div className="bg-white rounded-3xl border border-[#EAE3D9] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#EAE3D9] bg-[#FAF8F5] text-[#8A8179]">
                <th className="py-3 px-4 font-semibold">Comunidad de Tlaxcala</th>
                <th className="py-3 px-4 font-semibold">Costo de Envío</th>
                <th className="py-3 px-4 font-semibold">Tiempo Estimado</th>
                <th className="py-3 px-4 font-semibold">Pedido Mínimo</th>
                <th className="py-3 px-4 font-semibold text-center">Estado</th>
                <th className="py-3 px-4 font-semibold text-right">Quitar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2ECE4]">
              {zones.map((zone) => {
                const comm = communities.find((c) => c.id === zone.communityId);
                return (
                  <tr key={zone.id} className="hover:bg-[#FAF8F5]">
                    <td className="py-3 px-4 font-semibold text-[#2C2825]">
                      {comm ? `${comm.name} (${comm.municipality})` : zone.communityId}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span>$</span>
                        <input
                          type="number"
                          min={0}
                          step={5}
                          value={zone.deliveryFee}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setZones(zones.map((z) => (z.id === zone.id ? { ...z, deliveryFee: val } : z)));
                          }}
                          className="w-16 px-2 py-1 bg-white border border-[#EAE3D9] rounded text-xs font-semibold tabular-nums text-[#2C2825]"
                        />
                        <span className="text-[#8A8179]">MXN</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={zone.estimatedDeliveryTime}
                        onChange={(e) => {
                          const val = e.target.value;
                          setZones(zones.map((z) => (z.id === zone.id ? { ...z, estimatedDeliveryTime: val } : z)));
                        }}
                        className="px-2 py-1 bg-white border border-[#EAE3D9] rounded text-xs text-[#2C2825]"
                      />
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span>$</span>
                        <input
                          type="number"
                          min={0}
                          value={zone.minOrderAmount || 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setZones(zones.map((z) => (z.id === zone.id ? { ...z, minOrderAmount: val } : z)));
                          }}
                          className="w-16 px-2 py-1 bg-white border border-[#EAE3D9] rounded text-xs tabular-nums text-[#2C2825]"
                        />
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleZone(zone.id)}
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border cursor-pointer ${
                          zone.isActive
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {zone.isActive ? 'Activa' : 'Pausada'}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRemoveZone(zone.id)}
                        className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Eliminar zona"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
