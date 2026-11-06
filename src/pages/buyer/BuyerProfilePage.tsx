import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { Address } from '../../types';
import {
  User,
  MapPin,
  Phone,
  Mail,
  Plus,
  Trash2,
  Check,
  Save,
  Home,
} from 'lucide-react';

export const BuyerProfilePage: React.FC = () => {
  const { currentUser, updateCurrentProfile } = useAuth();
  const { communities } = useMarketplace();

  const [fullName, setFullName] = useState(currentUser.fullName);
  const [phone, setPhone] = useState(currentUser.phone);
  const [email] = useState(currentUser.email);
  const [addresses, setAddresses] = useState<Address[]>(currentUser.addresses || []);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Nueva dirección modal/estado
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newLabel, setNewLabel] = useState('Casa');
  const [newStreet, setNewStreet] = useState('');
  const [newExterior, setNewExterior] = useState('');
  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [newCommunityId, setNewCommunityId] = useState(communities[0]?.id || 'com-tlaxcala-centro');
  const [newRef, setNewRef] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateCurrentProfile({
        fullName,
        phone,
        addresses,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAddress = () => {
    if (!newStreet || !newNeighborhood) return;
    const newAddr: Address = {
      id: `addr-${Date.now()}`,
      label: newLabel,
      street: newStreet,
      exteriorNumber: newExterior,
      neighborhood: newNeighborhood,
      communityId: newCommunityId,
      reference: newRef,
      isDefault: addresses.length === 0,
    };
    const updated = [...addresses, newAddr];
    setAddresses(updated);
    updateCurrentProfile({ addresses: updated });
    setShowAddAddress(false);
    setNewStreet('');
    setNewExterior('');
    setNewNeighborhood('');
    setNewRef('');
  };

  const handleDeleteAddress = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    updateCurrentProfile({ addresses: updated });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-6 border-b border-[#EAE3D9]">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#B25E5C] mb-1">
          Panel de Comprador
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2C2825]">
          Mi Perfil y Direcciones
        </h1>
        <p className="text-xs text-[#7A736E] mt-1">
          Gestiona tu información personal y los puntos de entrega frecuentes en los municipios de Tlaxcala.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Información de perfil actualizada con éxito.</span>
        </div>
      )}

      {/* Formulario de Datos Personales */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] shadow-xs space-y-6">
        <h2 className="font-serif text-xl font-semibold text-[#2C2825] flex items-center gap-2">
          <User className="w-4 h-4 text-[#B25E5C]" />
          <span>Datos de contacto</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#2C2825] mb-1">Nombre completo</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#B25E5C]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2C2825] mb-1">Teléfono celular</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#B25E5C]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#2C2825] mb-1">Correo electrónico registrado</label>
          <input
            type="email"
            disabled
            value={email}
            className="w-full px-3.5 py-2.5 bg-slate-100 border border-[#EAE3D9] rounded-xl text-xs text-slate-500 cursor-not-allowed"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2C2825] hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Guardando...' : 'Guardar cambios'}</span>
          </button>
        </div>
      </form>

      {/* Direcciones Guardadas */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#F2ECE4]">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#2C2825] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#5A735E]" />
              <span>Mis direcciones en Tlaxcala</span>
            </h2>
            <p className="text-xs text-[#7A736E] mt-0.5">
              Utiliza estas ubicaciones para agilizar tus pedidos de flores a domicilio.
            </p>
          </div>

          <button
            onClick={() => setShowAddAddress(!showAddAddress)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF0ED] text-[#B25E5C] hover:bg-[#B25E5C] hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar dirección</span>
          </button>
        </div>

        {/* Formulario desplegable para nueva dirección */}
        {showAddAddress && (
          <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#EAE3D9] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#B25E5C]">
              Nueva dirección de entrega
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#2C2825] mb-1">Etiqueta (ej. Casa, Oficina)</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#EAE3D9] rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2C2825] mb-1">Calle y número</label>
                <input
                  type="text"
                  placeholder="Calle Morelos #14"
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#EAE3D9] rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2C2825] mb-1">Colonia / Barrio</label>
                <input
                  type="text"
                  placeholder="Centro"
                  value={newNeighborhood}
                  onChange={(e) => setNewNeighborhood(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#EAE3D9] rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#2C2825] mb-1">Comunidad / Municipio</label>
                <select
                  value={newCommunityId}
                  onChange={(e) => setNewCommunityId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#EAE3D9] rounded-lg text-xs"
                >
                  {communities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.municipality})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2C2825] mb-1">Referencias de entrega</label>
                <input
                  type="text"
                  placeholder="Fachada azul, entre calle 2 y 4"
                  value={newRef}
                  onChange={(e) => setNewRef(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#EAE3D9] rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddAddress(false)}
                className="px-3.5 py-1.5 text-xs text-[#7A736E] hover:text-[#2C2825]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddAddress}
                className="px-4 py-1.5 bg-[#5A735E] hover:bg-[#495e4d] text-white text-xs font-semibold rounded-lg"
              >
                Guardar dirección
              </button>
            </div>
          </div>
        )}

        {/* Lista de direcciones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => {
            const comm = communities.find((c) => c.id === addr.communityId);
            return (
              <div
                key={addr.id}
                className="p-4 rounded-2xl border border-[#EAE3D9] bg-[#FAF8F5] flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#2C2825] flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-[#B25E5C]" />
                      {addr.label}
                    </span>
                    {addr.isDefault && (
                      <span className="text-[10px] bg-white text-[#5A735E] font-medium px-2 py-0.5 rounded border border-[#DCE8DD]">
                        Predeterminada
                      </span>
                    )}
                  </div>
                  <div className="text-[#665E58]">
                    {addr.street} {addr.exteriorNumber && `#${addr.exteriorNumber}`}
                  </div>
                  <div className="text-[#7A736E]">
                    Col. {addr.neighborhood}, {comm ? comm.name : 'Tlaxcala'}
                  </div>
                  {addr.reference && (
                    <div className="text-[11px] text-[#8A8179] italic">Ref: {addr.reference}</div>
                  )}
                </div>

                <div className="flex justify-end pt-2 border-t border-[#EAE3D9]">
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="text-rose-700 hover:text-rose-900 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            );
          })}

          {addresses.length === 0 && (
            <div className="sm:col-span-2 py-8 text-center text-xs text-[#8A8179]">
              No tienes direcciones registradas todavía. Agrega una para facilitar tus entregas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
