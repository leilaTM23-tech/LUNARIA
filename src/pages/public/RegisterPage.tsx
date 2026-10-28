import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { repository } from '../../services/repository';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { Profile, Florist } from '../../types';
import { User, Store, Check, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { switchDemoUser } = useAuth();
  const { communities, refreshMarketplaceData } = useMarketplace();

  const [roleType, setRoleType] = useState<'buyer' | 'florist'>('buyer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Campos específicos de florería
  const [commercialName, setCommercialName] = useState('');
  const [address, setAddress] = useState('');
  const [communityId, setCommunityId] = useState(communities[0]?.id || 'com-tlaxcala-centro');
  const [whatsapp, setWhatsapp] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone) return;

    setLoading(true);
    try {
      const newUserId = `user-${Date.now()}`;

      if (roleType === 'buyer') {
        const newProfile: Profile = {
          id: newUserId,
          email,
          fullName,
          phone,
          role: 'buyer',
          addresses: [
            {
              id: `addr-${Date.now()}`,
              label: 'Dirección principal',
              street: 'Av. Principal',
              exteriorNumber: '1',
              neighborhood: 'Centro',
              communityId: communityId,
              isDefault: true,
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await repository.saveProfile(newProfile);
        await switchDemoUser(newUserId);
        setSuccessMessage('¡Cuenta creada exitosamente! Redirigiendo a tu perfil...');
        setTimeout(() => navigate('/comprador/perfil'), 1500);
      } else {
        // Registro de vendedor y florería
        const newFloristId = `flor-${Date.now()}`;
        const newFlorist: Florist = {
          id: newFloristId,
          ownerId: newUserId,
          commercialName: commercialName || `Florería de ${fullName}`,
          slug: (commercialName || fullName).toLowerCase().replace(/\s+/g, '-'),
          description: 'Nueva florería registrada en la plataforma Lunaria. Confección de ramos y arreglos locales.',
          address: address || 'Centro de Tlaxcala',
          communityId: communityId,
          phone,
          whatsapp: whatsapp || phone.replace(/\D/g, ''),
          openingHours: 'Lunes a Sábado: 9:00 AM - 7:00 PM',
          orderAgentName: fullName,
          registrationMethod: 'public_application',
          status: 'pending_review', // Regla de negocio: Estado de aprobación pendiente
          rating: 5.0,
          reviewCount: 0,
          deliveryZones: [
            {
              id: `dz-${newFloristId}-1`,
              floristId: newFloristId,
              communityId: communityId,
              deliveryFee: 50,
              estimatedDeliveryTime: '2 a 4 horas',
              isActive: true,
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const newProfile: Profile = {
          id: newUserId,
          email,
          fullName,
          phone,
          role: 'florist',
          floristId: newFloristId,
          addresses: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await repository.saveFlorist(newFlorist);
        await repository.saveProfile(newProfile);
        await refreshMarketplaceData();
        await switchDemoUser(newUserId);

        setSuccessMessage('¡Florería registrada con éxito! Tu estado inicial es "Pendiente de aprobación" por el Administrador.');
        setTimeout(() => navigate('/vendedor'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2C2825]">
          Crear cuenta en Lunaria
        </h1>
        <p className="text-xs text-[#7A736E]">
          Únete como comprador o impulsa las ventas de tu florería en Tlaxcala.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] shadow-sm space-y-6">
        {/* Selector de rol de registro (Comprador vs Vendedor) */}
        <div>
          <label className="block text-xs font-semibold text-[#2C2825] mb-2">
            ¿Cómo deseas participar en Lunaria?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRoleType('buyer')}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                roleType === 'buyer'
                  ? 'border-[#B25E5C] bg-[#FAF0ED] text-[#8C3D38]'
                  : 'border-[#EAE3D9] hover:bg-[#FAF8F5] text-[#2C2825]'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-xs">
                <User className="w-4 h-4 text-[#B25E5C]" />
              </div>
              <div>
                <div className="font-semibold text-xs">Quiero comprar flores</div>
                <div className="text-[11px] text-[#7A736E] mt-0.5">Explorar catálogo y enviar pedidos</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRoleType('florist')}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                roleType === 'florist'
                  ? 'border-[#5A735E] bg-[#F2F6F3] text-[#3E5241]'
                  : 'border-[#EAE3D9] hover:bg-[#FAF8F5] text-[#2C2825]'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-xs">
                <Store className="w-4 h-4 text-[#5A735E]" />
              </div>
              <div>
                <div className="font-semibold text-xs">Registrar mi florería</div>
                <div className="text-[11px] text-[#7A736E] mt-0.5">Vender mis ramos en Tlaxcala</div>
              </div>
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#2C2825] mb-1">Nombre completo *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ej. Mariana Herrera"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#B25E5C]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2C2825] mb-1">Teléfono celular *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="ej. 246 112 3344"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#B25E5C]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#2C2825] mb-1">Correo electrónico *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ej. contacto@floreriatlaxcala.com"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#B25E5C]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2C2825] mb-1">Contraseña de acceso</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#B25E5C]"
              />
            </div>
          </div>

          {/* Campos específicos de Florería */}
          {roleType === 'florist' && (
            <div className="pt-4 border-t border-[#F2ECE4] space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5A735E]">
                Datos del establecimiento floral
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#2C2825] mb-1">Nombre comercial de la florería *</label>
                  <input
                    type="text"
                    required
                    value={commercialName}
                    onChange={(e) => setCommercialName(e.target.value)}
                    placeholder="ej. Florería Magnolia"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#5A735E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#2C2825] mb-1">Comunidad / Municipio sede *</label>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#2C2825] mb-1">Dirección física del taller o local</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle, número y colonia"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#5A735E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#2C2825] mb-1">WhatsApp para recibir pedidos (10 dígitos)</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="ej. 522461234567"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#5A735E]"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#2C2825] hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Creando cuenta...' : 'Completar registro'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="text-center text-xs text-[#7A736E]">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-[#B25E5C] font-semibold hover:underline">
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
};
