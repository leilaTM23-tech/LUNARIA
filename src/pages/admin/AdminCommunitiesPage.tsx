import React, { useState } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { repository } from '../../services/repository';
import { Community } from '../../types';
import { MapPin, Plus, Check, Power, AlertCircle } from 'lucide-react';

export const AdminCommunitiesPage: React.FC = () => {
  const { communities, refreshMarketplaceData, florists } = useMarketplace();

  // Formulario de nueva comunidad
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [postalCodesStr, setPostalCodesStr] = useState('');
  const [notes, setNotes] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const handleToggleCommunity = async (id: string, currentStatus: boolean) => {
    await repository.toggleCommunityStatus(id, !currentStatus);
    await refreshMarketplaceData();
    setNotice(`Estado de la comunidad actualizado.`);
    setTimeout(() => setNotice(null), 2000);
  };

  const handleAddCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !municipality) return;

    const postalCodes = postalCodesStr
      .split(',')
      .map((cp) => cp.trim())
      .filter(Boolean);

    const newComm: Community = {
      id: `com-${Date.now()}`,
      name,
      municipality,
      postalCodes: postalCodes.length > 0 ? postalCodes : ['90000'],
      isActive: true,
      notes,
    };

    await repository.saveCommunity(newComm);
    await refreshMarketplaceData();
    setShowAddForm(false);
    setName('');
    setMunicipality('');
    setPostalCodesStr('');
    setNotes('');
    setNotice(`Comunidad "${newComm.name}" agregada exitosamente.`);
    setTimeout(() => setNotice(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-6 border-b border-[#EAE3D9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#8C3D38] mb-1">
            Módulo Territorial Tlaxcala
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2C2825]">
            Comunidades y Zonas de Cobertura ({communities.length})
          </h1>
          <p className="text-xs text-[#7A736E] mt-1 max-w-2xl leading-relaxed">
            Administra los municipios y localidades autorizadas en el estado de Tlaxcala. Activa o desactiva zonas para regular la visualización de florerías y entregas.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#2C2825] hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar comunidad</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs rounded-xl flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Formulario para Agregar Comunidad */}
      {showAddForm && (
        <form onSubmit={handleAddCommunity} className="bg-white rounded-3xl p-6 border border-[#EAE3D9] shadow-xs space-y-4">
          <h3 className="font-serif text-lg font-semibold text-[#2C2825] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#8C3D38]" />
            <span>Nueva comunidad o localidad en Tlaxcala</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#2C2825] mb-1">Nombre de la comunidad *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. San Jerónimo Zacualpan"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2C2825] mb-1">Municipio *</label>
              <input
                type="text"
                required
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                placeholder="ej. Zacualpan"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2C2825] mb-1">Códigos postales (separados por coma)</label>
              <input
                type="text"
                value={postalCodesStr}
                onChange={(e) => setPostalCodesStr(e.target.value)}
                placeholder="ej. 90700, 90701"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2C2825] mb-1">Notas de cobertura o logística</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ej. Zona conurbada sur, acceso por carretera federal"
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs text-[#7A736E] hover:text-[#2C2825]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#8C3D38] hover:bg-[#732f2b] text-white text-xs font-semibold rounded-xl"
            >
              Guardar comunidad
            </button>
          </div>
        </form>
      )}

      {/* Grid de Comunidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {communities.map((comm) => {
          const deliveringFlorists = florists.filter(
            (f) =>
              f.status === 'approved' &&
              f.deliveryZones.some((dz) => dz.communityId === comm.id && dz.isActive)
          );

          return (
            <div
              key={comm.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                comm.isActive
                  ? 'bg-white border-[#EAE3D9] shadow-xs'
                  : 'bg-slate-100/70 border-slate-200 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#B25E5C]" />
                    <h3 className="font-semibold text-sm text-[#2C2825]">{comm.name}</h3>
                  </div>
                  <button
                    onClick={() => handleToggleCommunity(comm.id, comm.isActive)}
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer ${
                      comm.isActive
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-200 text-slate-600 border-slate-300'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    <span>{comm.isActive ? 'Activa' : 'Inactiva'}</span>
                  </button>
                </div>

                <div className="mt-1 text-xs text-[#7A736E]">
                  Municipio: <strong>{comm.municipality}</strong> · CP {comm.postalCodes.join(', ')}
                </div>

                {comm.notes && (
                  <p className="mt-2 text-[11px] text-[#8A8179] italic leading-tight">
                    {comm.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#F2ECE4] flex items-center justify-between text-xs">
                <span className="text-[#5A735E] font-medium">
                  {deliveringFlorists.length} {deliveringFlorists.length === 1 ? 'florería con cobertura' : 'florerías con cobertura'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
