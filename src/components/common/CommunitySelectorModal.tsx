import React, { useState } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { MapPin, Search, Check, Sparkles } from 'lucide-react';
import { Community } from '../../types';

interface CommunitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommunitySelectorModal: React.FC<CommunitySelectorModalProps> = ({ isOpen, onClose }) => {
  const { communities, selectedCommunity, setSelectedCommunity, florists } = useMarketplace();
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredCommunities = communities.filter(
    (c) =>
      c.isActive &&
      (c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.municipality.toLowerCase().includes(search.toLowerCase()) ||
        c.postalCodes.some((cp) => cp.includes(search)))
  );

  const handleSelect = (comm: Community) => {
    setSelectedCommunity(comm);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-[#EAE3D9] p-6 max-h-[88vh] flex flex-col">
        <div className="flex items-start justify-between pb-4 border-b border-[#EAE3D9]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#FAF0ED] text-[#B25E5C] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#2C2825]">
                Selecciona tu comunidad en Tlaxcala
              </h2>
              <p className="text-xs text-[#7A736E]">
                Mostraremos florerías locales con cobertura de entrega y cálculo de tiempos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl font-light p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Buscador */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por municipio, comunidad o código postal..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#FAF8F5] border border-[#EAE3D9] rounded-lg focus:outline-none focus:border-[#B25E5C] focus:bg-white transition-all text-[#2C2825]"
          />
        </div>

        {/* Lista de comunidades */}
        <div className="mt-4 overflow-y-auto flex-1 space-y-2 pr-1">
          {filteredCommunities.map((comm) => {
            const isSelected = selectedCommunity?.id === comm.id;
            const availableFloristsCount = florists.filter(
              (f) =>
                f.status === 'approved' &&
                f.deliveryZones.some((dz) => dz.communityId === comm.id && dz.isActive)
            ).length;

            return (
              <button
                key={comm.id}
                onClick={() => handleSelect(comm)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'border-[#B25E5C] bg-[#FBF4F2]'
                    : 'border-[#EAE3D9] hover:border-[#D1C6BA] hover:bg-[#FAF8F5]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-[#2C2825]">{comm.name}</span>
                    <span className="text-xs text-[#8A8179] font-normal">({comm.municipality})</span>
                  </div>
                  <div className="text-xs text-[#7A736E] mt-0.5 flex items-center gap-2">
                    <span>CP {comm.postalCodes.join(', ')}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#5A735E] font-medium">
                      {availableFloristsCount} {availableFloristsCount === 1 ? 'florería disponible' : 'florerías disponibles'}
                    </span>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-[#B25E5C] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <span className="text-xs text-[#B25E5C] opacity-0 group-hover:opacity-100 font-medium">
                    Elegir
                  </span>
                )}
              </button>
            );
          })}

          {filteredCommunities.length === 0 && (
            <div className="py-8 text-center text-xs text-[#8A8179]">
              No encontramos comunidades que coincidan con &quot;{search}&quot;. El administrador puede agregar nuevas zonas desde el panel.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-[#EAE3D9] flex items-center justify-between text-xs text-[#7A736E]">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#B25E5C]" />
            Entregas el mismo día disponibles en zonas metropolitanas
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-[#2C2825] text-white rounded-lg text-xs font-medium hover:bg-black transition-colors cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
