import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { repository } from '../../services/repository';
import { FloristInvitation, Community } from '../../types';
import {
  Ticket,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Store,
  ShieldCheck,
  ArrowRight,
  MapPin,
  Sparkles,
} from 'lucide-react';

export const InvitationRegisterPage: React.FC = () => {
  const { token: routeToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const queryToken = searchParams.get('token') || '';
  const initialToken = routeToken || queryToken || '';

  const navigate = useNavigate();
  const { switchDemoUser } = useAuth();

  const [tokenInput, setTokenInput] = useState(initialToken);
  const [activeToken, setActiveToken] = useState(initialToken);
  const [invitation, setInvitation] = useState<FloristInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [completedFloristId, setCompletedFloristId] = useState<string | null>(null);

  // Form Fields
  const [commercialName, setCommercialName] = useState('');
  const [orderAgentName, setOrderAgentName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [allowsDelivery, setAllowsDelivery] = useState(true);
  const [allowsPickup, setAllowsPickup] = useState(true);
  const [deliveryCoverage, setDeliveryCoverage] = useState<string[]>([]);
  const [openingHours, setOpeningHours] = useState('Lunes a Sábado: 8:00 - 19:00');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const comms = await repository.getCommunities();
      setCommunities(comms);
      if (comms.length > 0) {
        setCommunityId(comms[0].id);
        setDeliveryCoverage([comms[0].id]);
      }

      if (activeToken) {
        const inv = await repository.getFloristInvitationByToken(activeToken.trim());
        setInvitation(inv);
        if (inv) {
          setCommercialName(inv.businessName);
        }
      } else {
        setInvitation(null);
      }
      setLoading(false);
    }
    loadData();
  }, [activeToken]);

  const handleLookupToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      setActiveToken(tokenInput.trim());
    }
  };

  const handleToggleCoverage = (commId: string) => {
    if (deliveryCoverage.includes(commId)) {
      if (deliveryCoverage.length > 1) {
        setDeliveryCoverage(deliveryCoverage.filter((id) => id !== commId));
      }
    } else {
      setDeliveryCoverage([...deliveryCoverage, commId]);
    }
  };

  const isExpired = invitation && new Date(invitation.expiresAt) < new Date();

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!orderAgentName.trim()) errs.orderAgentName = 'Ingresa el nombre del responsable del taller.';
    if (!phone.trim() || phone.length < 8) errs.phone = 'Ingresa un teléfono de contacto válido.';
    if (!whatsapp.trim() || whatsapp.length < 8) errs.whatsapp = 'Ingresa el número de WhatsApp para pedidos.';
    if (!address.trim()) errs.address = 'Ingresa la dirección de tu florería en Tlaxcala.';
    if (!description.trim() || description.length < 15) {
      errs.description = 'Ingresa una breve descripción de tu propuesta floral (mínimo 15 caracteres).';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation || !validate()) return;

    setSubmitting(true);
    try {
      const selectedComm = communities.find((c) => c.id === communityId);
      const newFloristId = `flor-inv-${Date.now().toString(36)}`;
      const newUserId = `user-${newFloristId}`;

      // 1. Mark invitation as used
      await repository.markInvitationUsed(invitation.token);

      // 2. Submit florist application (via invitation)
      await repository.submitFloristApplication({
        floristId: newFloristId,
        applicantId: newUserId,
        registrationMethod: 'invitation',
        invitationId: invitation.id,
        commercialName: commercialName || invitation.businessName,
        orderAgentName: orderAgentName.trim(),
        email: invitation.email,
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        communityId,
        communityName: selectedComm ? selectedComm.name : 'Tlaxcala',
        address: address.trim(),
        description: description.trim(),
        openingHours,
        allowsDelivery,
        allowsPickup,
        deliveryCoverage,
        prepTimeEstimated: '2 a 3 horas para entrega el mismo día',
        submittedDataSnapshot: {
          invitationToken: invitation.token,
          invitedByAdmin: invitation.createdByName,
        },
      });

      // 3. Switch demo profile
      switchDemoUser(newUserId);
      setCompletedFloristId(newFloristId);
    } finally {
      setSubmitting(false);
    }
  };

  if (completedFloristId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl border border-[#EAE3D9] p-8 sm:p-12 shadow-sm space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#5A735E]">
              Registro por Invitación Completado
            </span>
            <h1 className="font-serif text-3xl font-semibold text-[#2C2825]">
              ¡Bienvenida a Lunaria, {commercialName}!
            </h1>
            <p className="text-sm text-[#665E58] leading-relaxed">
              Tu token de invitación ha sido canjeado exitosamente. Tu registro ha sido enviado para revisión administrativa con prioridad preferente.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/vendedor')}
              className="px-6 py-3 bg-[#B25E5C] text-white font-medium text-xs rounded-xl hover:bg-[#9E4D48] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Acceder a la pantalla de seguimiento del vendedor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Encabezado */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF0ED] text-[#B25E5C] text-xs font-semibold uppercase tracking-wider border border-[#F2DDD9]">
          <Ticket className="w-3.5 h-3.5" />
          <span>Acceso Exclusivo por Invitación</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2C2825]">
          Registro de Florería Invitada
        </h1>
        <p className="text-xs sm:text-sm text-[#7A736E]">
          Completa los datos de tu taller utilizando tu token único emitido por la administración de Lunaria Tlaxcala.
        </p>
      </div>

      {/* Buscador de Token / Entrada si no hay token en ruta */}
      {!activeToken && (
        <div className="bg-white rounded-2xl border border-[#EAE3D9] p-6 max-w-md mx-auto shadow-xs space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#2C2825] mb-1">
              Ingresa tu código o token de invitación
            </label>
            <form onSubmit={handleLookupToken} className="flex gap-2">
              <input
                type="text"
                placeholder="Ej. inv-calpulalpan-889"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl focus:ring-[#B25E5C] focus:border-[#B25E5C]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#B25E5C] text-white text-xs font-medium rounded-xl hover:bg-[#9E4D48] transition-colors cursor-pointer"
              >
                Validar
              </button>
            </form>
          </div>

          <div className="pt-3 border-t border-[#F2ECE4] text-[11px] text-[#7A736E] space-y-2">
            <span className="font-semibold text-[#2C2825]">Tokens de prueba disponibles:</span>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setTokenInput('inv-calpulalpan-889');
                  setActiveToken('inv-calpulalpan-889');
                }}
                className="text-left p-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F2ECE4] border border-[#EAE3D9] text-[#2C2825] transition-colors cursor-pointer"
              >
                <div className="font-medium text-[#B25E5C]">inv-calpulalpan-889</div>
                <div className="text-[10px] text-[#8A8179]">Florería El Rosal Dorado (Calpulalpan) · Pendiente</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTokenInput('inv-tlaxco-991');
                  setActiveToken('inv-tlaxco-991');
                }}
                className="text-left p-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F2ECE4] border border-[#EAE3D9] text-[#2C2825] transition-colors cursor-pointer"
              >
                <div className="font-medium text-[#5A735E]">inv-tlaxco-991 (Ya canjeada por Patricia Juárez)</div>
                <div className="text-[10px] text-[#8A8179]">Florería La Magnolia de Tlaxco · Utilizada</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validación de Invitación */}
      {loading && (
        <div className="py-12 text-center text-xs text-[#8A8179]">Verificando enlace de invitación...</div>
      )}

      {!loading && activeToken && !invitation && (
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#2C2825]">Invitación no encontrada</h3>
            <p className="text-xs text-[#7A736E] mt-1">
              El token <code>{activeToken}</code> no existe en el sistema o fue cancelado.
            </p>
          </div>
          <button
            onClick={() => {
              setActiveToken('');
              setTokenInput('');
            }}
            className="px-4 py-2 bg-white border border-[#EAE3D9] text-xs font-medium rounded-xl hover:bg-[#FAF8F5] cursor-pointer"
          >
            Intentar con otro token
          </button>
        </div>
      )}

      {!loading && invitation && invitation.status === 'revoked' && (
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-rose-900">Invitación revocada</h3>
            <p className="text-xs text-[#7A736E] mt-1">
              Esta invitación fue cancelada por la administración de Lunaria Tlaxcala. Si crees que se trata de un error, comunícate con el soporte de la plataforma.
            </p>
          </div>
        </div>
      )}

      {!loading && invitation && invitation.status === 'used' && (
        <div className="bg-white rounded-2xl border border-amber-200 p-8 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#2C2825]">Invitación ya utilizada</h3>
            <p className="text-xs text-[#7A736E] mt-1">
              Este token ya fue canjeado por <strong>{invitation.businessName}</strong> el{' '}
              {invitation.usedAt ? new Date(invitation.usedAt).toLocaleDateString('es-MX') : 'recientemente'}. Las invitaciones son de uso único por seguridad.
            </p>
          </div>
          <Link
            to="/vendedor"
            className="inline-block px-4 py-2 bg-[#B25E5C] text-white text-xs font-medium rounded-xl hover:bg-[#9E4D48]"
          >
            Ir al panel del vendedor
          </Link>
        </div>
      )}

      {!loading && invitation && isExpired && invitation.status !== 'used' && invitation.status !== 'revoked' && (
        <div className="bg-white rounded-2xl border border-amber-200 p-8 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#2C2825]">Invitación vencida</h3>
            <p className="text-xs text-[#7A736E] mt-1">
              Esta invitación expiró el {new Date(invitation.expiresAt).toLocaleDateString('es-MX')}. Solicita una nueva invitación al administrador.
            </p>
          </div>
        </div>
      )}

      {/* FORMULARIO VÁLIDO DE INVITACIÓN ACTIVA */}
      {!loading && invitation && invitation.status === 'pending' && !isExpired && (
        <div className="bg-white rounded-3xl border border-[#EAE3D9] p-6 sm:p-10 shadow-xs space-y-8">
          {/* Banner de invitación confirmada */}
          <div className="bg-[#FAF8F5] rounded-2xl p-5 border border-[#EAE3D9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF0ED] text-[#B25E5C] flex items-center justify-center font-bold">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#5A735E]">
                  Invitación Verificada
                </span>
                <h2 className="font-serif text-xl font-semibold text-[#2C2825]">
                  {invitation.businessName}
                </h2>
                <div className="text-xs text-[#7A736E]">
                  Enviada a: <strong>{invitation.email}</strong> · Emitida por: {invitation.createdByName}
                </div>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="text-[#8A8179]">Válida hasta:</span>{' '}
              <strong className="text-[#2C2825]">
                {new Date(invitation.expiresAt).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </strong>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#2C2825] mb-1">
                  Nombre comercial registrado
                </label>
                <input
                  type="text"
                  value={commercialName}
                  onChange={(e) => setCommercialName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2C2825] mb-1">
                  Nombre de la persona responsable *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Patricia Juárez Morales"
                  value={orderAgentName}
                  onChange={(e) => setOrderAgentName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border rounded-xl ${
                    errors.orderAgentName ? 'border-rose-300' : 'border-[#EAE3D9]'
                  }`}
                />
                {errors.orderAgentName && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.orderAgentName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#2C2825] mb-1">
                  Teléfono de contacto *
                </label>
                <input
                  type="tel"
                  placeholder="246 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border rounded-xl ${
                    errors.phone ? 'border-rose-300' : 'border-[#EAE3D9]'
                  }`}
                />
                {errors.phone && <p className="text-[11px] text-rose-600 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2C2825] mb-1">
                  WhatsApp para pedidos de clientes *
                </label>
                <input
                  type="tel"
                  placeholder="246 987 6543"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border rounded-xl ${
                    errors.whatsapp ? 'border-rose-300' : 'border-[#EAE3D9]'
                  }`}
                />
                {errors.whatsapp && <p className="text-[11px] text-rose-600 mt-1">{errors.whatsapp}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#2C2825] mb-1">
                  Comunidad / Municipio *
                </label>
                <select
                  value={communityId}
                  onChange={(e) => setCommunityId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl"
                >
                  {communities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#2C2825] mb-1">
                  Dirección exacta de tu taller o tienda *
                </label>
                <input
                  type="text"
                  placeholder="Calle Hidalgo #12, Centro"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border rounded-xl ${
                    errors.address ? 'border-rose-300' : 'border-[#EAE3D9]'
                  }`}
                />
                {errors.address && <p className="text-[11px] text-rose-600 mt-1">{errors.address}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2C2825] mb-1">
                Descripción de la florería y catálogo representativo *
              </label>
              <textarea
                rows={3}
                placeholder="Ramos para aniversarios, arreglos en canasta, follaje de monte..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border rounded-xl ${
                  errors.description ? 'border-rose-300' : 'border-[#EAE3D9]'
                }`}
              />
              {errors.description && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.description}</p>
              )}
            </div>

            {/* Cobertura */}
            <div>
              <label className="block text-xs font-medium text-[#2C2825] mb-2">
                Zonas de Tlaxcala donde ofreces servicio
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {communities.map((comm) => {
                  const isChecked = deliveryCoverage.includes(comm.id);
                  return (
                    <button
                      type="button"
                      key={comm.id}
                      onClick={() => handleToggleCoverage(comm.id)}
                      className={`p-2 rounded-lg border text-xs text-left transition-colors flex items-center justify-between cursor-pointer ${
                        isChecked
                          ? 'bg-[#FAF0ED] border-[#B25E5C] text-[#8C3D38] font-medium'
                          : 'bg-[#FAF8F5] border-[#EAE3D9] text-[#5C534E]'
                      }`}
                    >
                      <span className="truncate">{comm.name}</span>
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-[#B25E5C] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#EAE3D9]">
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-[#B25E5C] hover:bg-[#9E4D48] text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2"
              >
                {submitting ? (
                  <span>Canjeando invitación...</span>
                ) : (
                  <>
                    <span>Completar registro con invitación</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
