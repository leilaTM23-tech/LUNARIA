import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { repository } from '../../services/repository';
import { ProductOffer } from '../../types';
import { Package, AlertTriangle, Check, RefreshCw, Plus, Minus } from 'lucide-react';

export const VendorInventoryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const floristId = currentUser.floristId || 'flor-1';

  const [offers, setOffers] = useState<ProductOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadInventory() {
      setLoading(true);
      try {
        const myOffers = await repository.getProductOffers({ floristId });
        setOffers(myOffers);
      } finally {
        setLoading(false);
      }
    }
    loadInventory();
  }, [floristId]);

  const handleStockDelta = async (id: string, delta: number) => {
    const current = offers.find((o) => o.id === id);
    if (!current) return;
    const newStock = Math.max(0, current.stock + delta);

    await repository.updateOfferStock(id, newStock);
    setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, stock: newStock } : o)));
    setSavedNotice(`Stock de "${current.title}" actualizado a ${newStock} piezas.`);
    setTimeout(() => setSavedNotice(null), 2000);
  };

  const handleManualStockChange = async (id: string, value: number) => {
    const valid = Math.max(0, isNaN(value) ? 0 : value);
    await repository.updateOfferStock(id, valid);
    setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, stock: valid } : o)));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-6 border-b border-[#EAE3D9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#5A735E] mb-1">
            Gestión de Almacén
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2C2825]">
            Control Rápido de Inventario
          </h1>
          <p className="text-xs text-[#7A736E] mt-1">
            Ajusta las existencias en tiempo real para evitar órdenes con flores no disponibles.
          </p>
        </div>

        {savedNotice && (
          <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs rounded-xl flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>{savedNotice}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[#8A8179]">Cargando inventario...</div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#EAE3D9] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#EAE3D9] bg-[#FAF8F5] text-[#8A8179]">
                  <th className="py-3 px-4 font-semibold">Arreglo / Producto</th>
                  <th className="py-3 px-4 font-semibold">Precio</th>
                  <th className="py-3 px-4 font-semibold text-center">Nivel de Alerta</th>
                  <th className="py-3 px-4 font-semibold text-center">Existencias en Taller</th>
                  <th className="py-3 px-4 font-semibold text-right">Ajuste Rápido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE4]">
                {offers.map((offer) => {
                  const isOut = offer.stock === 0;
                  const isLow = offer.stock > 0 && offer.stock < 5;

                  return (
                    <tr key={offer.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#2C2825]">{offer.title}</div>
                        <div className="text-[11px] text-[#8A8179]">
                          Prep: {offer.preparationTime} · {offer.sameDayDelivery ? 'Mismo día' : 'Bajo pedido'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold tabular-nums text-[#2C2825]">
                        ${offer.price.toLocaleString('es-MX')} MXN
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isOut && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-semibold">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Agotado
                          </span>
                        )}
                        {isLow && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                            Stock crítico ({offer.stock} pzas)
                          </span>
                        )}
                        {!isOut && !isLow && (
                          <span className="text-[11px] text-[#5A735E] font-medium">Abundante</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="number"
                          min={0}
                          value={offer.stock}
                          onChange={(e) => handleManualStockChange(offer.id, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-center font-bold text-sm bg-[#FAF8F5] border border-[#EAE3D9] rounded-lg tabular-nums text-[#2C2825] focus:outline-none focus:border-[#5A735E]"
                        />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleStockDelta(offer.id, -1)}
                            disabled={offer.stock <= 0}
                            className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#EAE3D9] flex items-center justify-center text-[#2C2825] hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                            title="Restar 1 pieza"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStockDelta(offer.id, 1)}
                            className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#EAE3D9] flex items-center justify-center text-[#2C2825] hover:bg-slate-200 cursor-pointer"
                            title="Sumar 1 pieza"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStockDelta(offer.id, 5)}
                            className="px-2 py-1 text-[11px] font-semibold bg-[#FAF0ED] text-[#B25E5C] rounded-lg hover:bg-[#B25E5C] hover:text-white transition-colors cursor-pointer"
                            title="Sumar lote de 5"
                          >
                            +5
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
