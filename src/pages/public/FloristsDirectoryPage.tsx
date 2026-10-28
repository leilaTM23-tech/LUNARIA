import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMarketplace } from '../../context/MarketplaceContext';
import {
  MapPin,
  Star,
  Clock,
  Phone,
  MessageCircle,
  Truck,
  ArrowRight,
  Filter,
} from 'lucide-react';

export const FloristsDirectoryPage: React.FC = () => {
  const { florists, communities, selectedCommunity, setSelectedCommunity } = useMarketplace();
  const [filterCommId, setFilterCommId] = useState<string>(selectedCommunity?.id || 'all');

  const filteredFlorists = florists.filter((f) => {
    if (f.status !== 'approved') return false;
    if (filterCommId !== 'all') {
      return f.deliveryZones.some((dz) => dz.communityId === filterCommId && dz.isActive);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Encabezado */}
      <div className="pb-6 border-b border-[#EAE3D9] flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#5A735E] mb-1">
            Red artesanal de florerías locales
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#2C2825]">
            Directorio de Florerías en Tlaxcala
          </h1>
          <p className="text-xs text-[#7A736E] mt-1 max-w-xl">
            Talleres y boutiques florales legalmente establecidos en los municipios de Tlaxcala, con atención personalizada y repartidores locales.
          </p>
        </div>

        {/* Filtro por comunidad */}
        <div className="bg-white p-2.5 rounded-xl border border-[#EAE3D9] flex items-center gap-2 self-start md:self-auto">
          <Filter className="w-4 h-4 text-[#5A735E] shrink-0" />
          <div className="text-xs">
            <span className="text-[#8A8179] block text-[10px]">Filtrar florerías con cobertura en:</span>
            <select
              value={filterCommId}
              onChange={(e) => {
                const val = e.target.value;
                setFilterCommId(val);
                if (val !== 'all') {
                  const comm = communities.find((c) => c.id === val);
                  if (comm) setSelectedCommunity(comm);
                }
              }}
              className="font-semibold text-[#2C2825] bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">Todas las localidades de Tlaxcala</option>
              {communities
                .filter((c) => c.isActive)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.municipality})
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Florerías */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredFlorists.map((f) => (
          <div
            key={f.id}
            className="bg-white rounded-3xl p-6 border border-[#EAE3D9] flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FAF0ED] text-[#B25E5C] flex items-center justify-center font-serif font-bold text-lg">
                  {f.commercialName.charAt(0)}
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold">{f.rating.toFixed(1)}</span>
                  <span className="text-[#8A8179]">({f.reviewCount})</span>
                </div>
              </div>

              <h3 className="font-serif text-xl font-semibold text-[#2C2825]">{f.commercialName}</h3>
              <p className="text-xs text-[#665E58] mt-2 line-clamp-3 leading-relaxed">
                {f.description}
              </p>

              <div className="mt-4 pt-3 border-t border-[#F2ECE4] space-y-2 text-xs text-[#7A736E]">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#B25E5C] shrink-0 mt-0.5" />
                  <span>{f.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#A8A199] shrink-0" />
                  <span className="truncate">{f.openingHours}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#A8A199] shrink-0" />
                  <span>{f.phone}</span>
                </div>
              </div>

              {/* Zonas cubiertas */}
              <div className="mt-4 pt-3 border-t border-[#F2ECE4]">
                <div className="text-[11px] font-semibold text-[#2C2825] mb-1.5 flex items-center gap-1">
                  <Truck className="w-3 h-3 text-[#5A735E]" />
                  <span>Zonas de cobertura directa ({f.deliveryZones.length}):</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {f.deliveryZones.map((dz) => {
                    const c = communities.find((comm) => comm.id === dz.communityId);
                    return (
                      <span
                        key={dz.id}
                        className="text-[10px] bg-[#FAF8F5] text-[#5C534E] px-2 py-0.5 rounded border border-[#EAE3D9]"
                      >
                        {c?.name || dz.communityId}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="mt-6 pt-4 border-t border-[#F2ECE4] flex items-center justify-between">
              <a
                href={`https://wa.me/${f.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#25D366] hover:underline font-medium"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              <Link
                to={`/floreria/${f.id}`}
                className="inline-flex items-center gap-1 px-4 py-2 bg-[#2C2825] hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <span>Ver catálogo</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
