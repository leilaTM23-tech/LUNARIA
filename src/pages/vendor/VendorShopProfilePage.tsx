import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { repository } from '../../services/repository';
import { Florist } from '../../types';
import {
  Store,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Instagram,
  UserCheck,
  Check,
  Save,
  AlertCircle,
} from 'lucide-react';

export const VendorShopProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { communities, refreshMarketplaceData } = useMarketplace();
  const floristId = currentUser.floristId || 'flor-1';

  const [florist, setFlorist] = useState<Florist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Campos del formulario
  const [commercialName, setCommercialName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [orderAgentName, setOrderAgentName] = useState('');

  useEffect(() => {
    async function loadShop() {
      setLoading(true);
      try {
        const fl = await repository.getFloristById(floristId);
        if (fl) {
          setFlorist(fl);
          setCommercialName(fl.commercialName);
          setDescription(fl.description);
          setAddress(fl.address);
          setCommunityId(fl.communityId);
          setPhone(fl.phone);
          setWhatsapp(fl.whatsapp);
          setInstagram(fl.instagram || '');
          setOpeningHours(fl.openingHours);
          setOrderAgentName(fl.orderAgentName);
        }
      } finally {
        setLoading(false);
      }
    }
    loadShop();
  }, [floristId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!florist) return;

    setIsSaving(true);
    try {
      const updated: Florist = {
        ...florist,
        commercialName,
        description,
        address,
        communityId,
        phone,
        whatsapp,
        instagram,
        openingHours,
        orderAgentName,
        updatedAt: new Date().toISOString(),
      };
      await repository.saveFlorist(updated);
      await refreshMarketplaceData();
      setFlorist(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !florist) {
    return <div className="py-20 text-center text-xs text-[#8A8179]">Cargando datos de la florería...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-6 border-b border-[#EAE3D9]">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#5A735E] mb-1">
          Configuración Comercial
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2C2825]">
          Perfil de Mi Florería
        </h1>
        <p className="text-xs text-[#7A736E] mt-1">
          Esta información es visible para los compradores en el directorio de Tlaxcala y en tus productos.
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Información de la florería actualizada exitosamente.</span>
        </div>
      )}

      {/* Estado de Aprobación */}
      <div className="p-4 rounded-2xl bg-white border border-[#EAE3D9] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FAF0ED] text-[#B25E5C] flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#2C2825]">Estado de verificación administrativa</div>
            <div className="text-[11px] text-[#7A736E]">Supervisado por la administración central de Lunaria</div>
          </div>
        </div>

        <div>
          {florist.status === 'approved' && (
            <span className="text-xs bg-emerald-50 text-emerald-800 font-semibold px-3 py-1 rounded-full border border-emerald-200">
              ✓ Florería Aprobada y Activa
            </span>
          )}
          {(florist.status === 'pending_review' || florist.status === 'draft') && (
            <span className="text-xs bg-amber-50 text-amber-800 font-semibold px-3 py-1 rounded-full border border-amber-200">
              ⏳ Revisión Pendiente
            </span>
          )}
          {florist.status === 'info_required' && (
            <span className="text-xs bg-purple-50 text-purple-800 font-semibold px-3 py-1 rounded-full border border-purple-200">
              ⚠️ Información Adicional Requerida
            </span>
          )}
          {florist.status === 'rejected' && (
            <span className="text-xs bg-rose-50 text-rose-800 font-semibold px-3 py-1 rounded-full border border-rose-200">
              ✕ Solicitud Rechazada
            </span>
          )}
          {florist.status === 'suspended' && (
            <span className="text-xs bg-rose-50 text-rose-800 font-semibold px-3 py-1 rounded-full border border-rose-200">
              ✕ Florería Suspendida
            </span>
          )}
        </div>
      </div>

      {/* Formulario de Florería */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] shadow-xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#2C2825] mb-1">Nombre comercial *</label>
            <input
              type="text"
              required
              value={commercialName}
              onChange={(e) => setCommercialName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#5A735E]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2C2825] mb-1">Responsable o agente de pedidos *</label>
            <input
              type="text"
              required
              value={orderAgentName}
              onChange={(e) => setOrderAgentName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#5A735E]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#2C2825] mb-1">Descripción del taller o florería</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#5A735E]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#2C2825] mb-1">Dirección física del taller *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#5A735E]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2C2825] mb-1">Comunidad sede en Tlaxcala *</label>
            <select
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#5A735E]"
            >
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.municipality})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#2C2825] mb-1">Teléfono comercial</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#5A735E]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2C2825] mb-1">WhatsApp oficial (10-12 dígitos)</label>
            <input
              type="text"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#5A735E]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2C2825] mb-1">Instagram (@usuario)</label>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@mi_floreria"
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#5A735E]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#2C2825] mb-1">Horarios y días de atención</label>
          <input
            type="text"
            value={openingHours}
            onChange={(e) => setOpeningHours(e.target.value)}
            placeholder="Lunes a Sábado: 8:30 AM - 8:30 PM | Domingo: 9:00 AM - 3:00 PM"
            className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#5A735E]"
          />
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#2C2825] hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando...' : 'Guardar perfil de florería'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
