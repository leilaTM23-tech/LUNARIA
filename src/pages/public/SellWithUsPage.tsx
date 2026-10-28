import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { repository } from '../../services/repository';
import { Community } from '../../types';
import {
  Store,
  Sparkles,
  MapPin,
  Clock,
  Truck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  FileText,
  Phone,
  Mail,
  User,
  HeartHandshake,
} from 'lucide-react';

export const SellWithUsPage: React.FC = () => {
  const navigate = useNavigate();
  const { switchDemoUser } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedFloristId, setSubmittedFloristId] = useState<string | null>(null);

  // Form State
  const [commercialName, setCommercialName] = useState('');
  const [orderAgentName, setOrderAgentName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [openingHours, setOpeningHours] = useState('Lunes a Sábado: 8:30 - 19:30 | Domingo: 9:00 - 15:00');
  const [allowsDelivery, setAllowsDelivery] = useState(true);
  const [allowsPickup, setAllowsPickup] = useState(true);
  const [deliveryCoverage, setDeliveryCoverage] = useState<string[]>([]);
  const [prepTimeEstimated, setPrepTimeEstimated] = useState('2 a 4 horas para entrega el mismo día');
  const [logoSeed, setLogoSeed] = useState('rosa');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    async function loadCommunities() {
      const comms = await repository.getCommunities();
      setCommunities(comms);
      if (comms.length > 0) {
        setCommunityId(comms[0].id);
        setDeliveryCoverage([comms[0].id]);
      }
      setLoading(false);
    }
    loadCommunities();
  }, []);

  const handleToggleCoverage = (commId: string) => {
    if (deliveryCoverage.includes(commId)) {
      if (deliveryCoverage.length > 1) {
        setDeliveryCoverage(deliveryCoverage.filter((id) => id !== commId));
      }
    } else {
      setDeliveryCoverage([...deliveryCoverage, commId]);
    }
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!commercialName.trim()) errs.commercialName = 'Ingresa el nombre comercial de tu florería.';
    if (!orderAgentName.trim()) errs.orderAgentName = 'Ingresa el nombre del responsable del taller o pedidos.';
    if (!email.trim() || !email.includes('@')) errs.email = 'Ingresa un correo electrónico válido.';
    if (!phone.trim() || phone.length < 8) errs.phone = 'Ingresa un número telefónico de contacto (10 dígitos).';
    if (!whatsapp.trim() || whatsapp.length < 8) errs.whatsapp = 'Ingresa el número de WhatsApp para recibir pedidos.';
    if (!address.trim()) errs.address = 'Especifica la dirección física de tu taller o tienda en Tlaxcala.';
    if (!description.trim() || description.length < 20) {
      errs.description = 'Describe tu propuesta floral y especialidad (mínimo 20 caracteres).';
    }
    if (!allowsDelivery && !allowsPickup) {
      errs.delivery = 'Debes seleccionar al menos una modalidad (Entrega a domicilio o Recolección).';
    }
    if (allowsDelivery && deliveryCoverage.length === 0) {
      errs.coverage = 'Selecciona al menos una comunidad donde ofreces entrega.';
    }
    if (!acceptTerms) {
      errs.acceptTerms = 'Debes aceptar las políticas de calidad y el aviso de privacidad de Lunaria.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      const selectedComm = communities.find((c) => c.id === communityId);
      const newFloristId = `flor-pub-${Date.now().toString(36)}`;
      const newUserId = `user-${newFloristId}`;

      // 1. Submit application to repository
      await repository.submitFloristApplication({
        floristId: newFloristId,
        applicantId: newUserId,
        registrationMethod: 'public_application',
        commercialName: commercialName.trim(),
        orderAgentName: orderAgentName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        instagram: instagram.trim() ? `@${instagram.replace('@', '').trim()}` : undefined,
        communityId,
        communityName: selectedComm ? selectedComm.name : 'Tlaxcala',
        address: address.trim(),
        description: description.trim(),
        openingHours,
        allowsDelivery,
        allowsPickup,
        deliveryCoverage,
        prepTimeEstimated,
        submittedDataSnapshot: {
          logoSeed,
          submittedAt: new Date().toISOString(),
        },
      });

      // 2. Switch demo profile to this newly created florist
      switchDemoUser(newUserId);
      setSubmittedFloristId(newFloristId);
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedFloristId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl border border-[#EAE3D9] p-8 sm:p-12 shadow-sm space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#5A735E]">
              Solicitud de Florería Registrada con Éxito
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2C2825]">
              ¡Bienvenido a Lunaria, {commercialName}!
            </h1>
            <p className="text-sm text-[#665E58] max-w-lg mx-auto leading-relaxed">
              Tu solicitud pública ha sido enviada al equipo administrativo de Lunaria Tlaxcala. Hemos creado tu cuenta de vendedor y puedes consultar el avance de la revisión en tiempo real.
            </p>
          </div>

          {/* Resumen del registro */}
          <div className="bg-[#FAF8F5] rounded-2xl p-5 border border-[#EAE3D9] text-left text-xs space-y-2 max-w-md mx-auto">
            <div className="flex justify-between py-1 border-b border-[#F0EBE3]">
              <span className="text-[#8A8179]">Modalidad:</span>
              <strong className="text-[#2C2825]">Solicitud Pública</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F0EBE3]">
              <span className="text-[#8A8179]">Estado actual:</span>
              <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
                Pendiente de revisión
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F0EBE3]">
              <span className="text-[#8A8179]">Responsable:</span>
              <span className="text-[#2C2825] font-medium">{orderAgentName}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#8A8179]">Comunidad base:</span>
              <span className="text-[#2C2825] font-medium">
                {communities.find((c) => c.id === communityId)?.name || 'Tlaxcala'}
              </span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/vendedor')}
              className="w-full sm:w-auto px-6 py-3 bg-[#B25E5C] text-white font-medium text-xs rounded-xl hover:bg-[#9E4D48] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Ir a la pantalla de seguimiento del vendedor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/catalogo"
              className="w-full sm:w-auto px-6 py-3 bg-white border border-[#EAE3D9] text-[#5C534E] font-medium text-xs rounded-xl hover:bg-[#FAF8F5] transition-colors"
            >
              Explorar el marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF0ED] text-[#B25E5C] text-xs font-semibold uppercase tracking-wider border border-[#F2DDD9]">
          <Store className="w-3.5 h-3.5" />
          <span>Programa de Florerías Locales de Tlaxcala</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[#2C2825] tracking-tight">
          Vende tus flores en Lunaria
        </h1>
        <p className="text-sm sm:text-base text-[#665E58] leading-relaxed">
          Únete al marketplace que conecta a los mejores floristas y talleres botánicos de Tlaxcala con clientes que buscan flores frescas para ocasiones especiales.
        </p>
      </div>

      {/* Propuesta de valor en 3 pilares */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-[#EAE3D9] shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#FAF0ED] text-[#B25E5C] flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-[#2C2825]">Pedidos directos a WhatsApp</h3>
          <p className="text-xs text-[#7A736E] leading-relaxed">
            Recibe mensajes con el desglose exacto de flores, dedicatorias y dirección de entrega listos para confirmar.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#EAE3D9] shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#F0F5F1] text-[#5A735E] flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-[#2C2825]">Cobertura municipal flexible</h3>
          <p className="text-xs text-[#7A736E] leading-relaxed">
            Tú decides a qué municipios de Tlaxcala realizas envíos a domicilio o si prefieres recolección en tu taller.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#EAE3D9] shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#F5F2EB] text-[#7A6953] flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-[#2C2825]">Sello de calidad local</h3>
          <p className="text-xs text-[#7A736E] leading-relaxed">
            Revisamos cada solicitud para asegurar una experiencia confiable y de alta reputación para todas las florerías.
          </p>
        </div>
      </div>

      {/* Formulario Principal */}
      <div className="bg-white rounded-3xl border border-[#EAE3D9] p-6 sm:p-10 shadow-xs">
        <div className="border-b border-[#EAE3D9] pb-6 mb-8">
          <h2 className="font-serif text-2xl font-semibold text-[#2C2825]">
            Formulario de Registro Público para Florerías
          </h2>
          <p className="text-xs text-[#7A736E] mt-1">
            Completa la información sobre tu negocio. Una vez enviada, nuestro equipo revisará los datos en menos de 24 horas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECCIÓN 1: Identidad y Contacto */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#B25E5C] flex items-center gap-2">
              <Store className="w-4 h-4" />
              <span>1. Identidad comercial y persona responsable</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#2C2825] mb-1">
                  Nombre comercial de la florería *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Florería Bugambilia Silvestre"
                  value={commercialName}
                  onChange={(e) => setCommercialName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border rounded-xl focus:outline-hidden focus:ring-1 transition-colors ${
                    errors.commercialName
                      ? 'border-rose-300 ring-rose-200'
                      : 'border-[#EAE3D9] focus:ring-[#B25E5C] focus:border-[#B25E5C]'
                  }`}
                />
                {errors.commercialName && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.commercialName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2C2825] mb-1">
                  Nombre del responsable / florista principal *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Patricia Juárez Morales"
                  value={orderAgentName}
                  onChange={(e) => setOrderAgentName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border rounded-xl focus:outline-hidden focus:ring-1 transition-colors ${
                    errors.orderAgentName
                      ? 'border-rose-300 ring-rose-200'
                      : 'border-[#EAE3D9] focus:ring-[#B25E5C] focus:border-[#B25E5C]'
                  }`}
                />
                {errors.orderAgentName && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.orderAgentName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#2C2825] mb-1">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  placeholder="contacto@floreriatlaxcala.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border rounded-xl focus:outline-hidden focus:ring-1 transition-colors ${
                    errors.email
                      ? 'border-rose-300 ring-rose-200'
                      : 'border-[#EAE3D9] focus:ring-[#B25E5C] focus:border-[#B25E5C]'
                  }`}
                />
                {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2C2825] mb-1">
                  Teléfono de contacto (10 dígitos) *
                </label>
                <input
                  type="tel"
                  placeholder="246 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border rounded-xl focus:outline-hidden focus:ring-1 transition-colors ${
                    errors.phone
                      ? 'border-rose-300 ring-rose-200'
                      : 'border-[#EAE3D9] focus:ring-[#B25E5C] focus:border-[#B25E5C]'
                  }`}
                />
                {errors.phone && <p className="text-[11px] text-rose-600 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2C2825] mb-1">
                  WhatsApp para pedidos (10 dígitos) *
                </label>
                <input
                  type="tel"
                  placeholder="246 987 6543"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border rounded-xl focus:outline-hidden focus:ring-1 transition-colors ${
                    errors.whatsapp
                      ? 'border-rose-300 ring-rose-200'
                      : 'border-[#EAE3D9] focus:ring-[#B25E5C] focus:border-[#B25E5C]'
                  }`}
                />
                {errors.whatsapp && <p className="text-[11px] text-rose-600 mt-1">{errors.whatsapp}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2C2825] mb-1">
                Usuario de Instagram (opcional)
              </label>
              <input
                type="text"
                placeholder="@floreriatlaxcala"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full sm:w-1/2 px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl focus:ring-[#B25E5C] focus:border-[#B25E5C]"
              />
            </div>
          </div>

          {/* SECCIÓN 2: Ubicación física y descripción */}
          <div className="space-y-4 pt-6 border-t border-[#EAE3D9]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#B25E5C] flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>2. Establecimiento y ubicación en Tlaxcala</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#2C2825] mb-1">
                  Comunidad / Municipio sede *
                </label>
                <select
                  value={communityId}
                  onChange={(e) => setCommunityId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl focus:ring-[#B25E5C] focus:border-[#B25E5C]"
                >
                  {communities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.postalCodes?.[0] || 'Tlaxcala'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#2C2825] mb-1">
                  Dirección exacta del taller o local *
                </label>
                <input
                  type="text"
                  placeholder="Av. Independencia #45, Col. Centro, Tlaxcala"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border rounded-xl focus:outline-hidden focus:ring-1 transition-colors ${
                    errors.address
                      ? 'border-rose-300 ring-rose-200'
                      : 'border-[#EAE3D9] focus:ring-[#B25E5C] focus:border-[#B25E5C]'
                  }`}
                />
                {errors.address && <p className="text-[11px] text-rose-600 mt-1">{errors.address}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2C2825] mb-1">
                Descripción de la florería y especialidad botánica *
              </label>
              <textarea
                rows={3}
                placeholder="Cuéntanos sobre tu taller: estilos florales (ramos campestres, rosas premium, arreglos fúnebres), origen de tus flores y experiencia..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border rounded-xl focus:outline-hidden focus:ring-1 transition-colors ${
                  errors.description
                    ? 'border-rose-300 ring-rose-200'
                    : 'border-[#EAE3D9] focus:ring-[#B25E5C] focus:border-[#B25E5C]'
                }`}
              />
              {errors.description && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#2C2825] mb-1">
                  Horarios y días de atención *
                </label>
                <input
                  type="text"
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2C2825] mb-1">
                  Tiempo estimado de preparación y entrega *
                </label>
                <input
                  type="text"
                  value={prepTimeEstimated}
                  onChange={(e) => setPrepTimeEstimated(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: Operaciones y Zonas de Entrega */}
          <div className="space-y-4 pt-6 border-t border-[#EAE3D9]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#B25E5C] flex items-center gap-2">
              <Truck className="w-4 h-4" />
              <span>3. Modalidades y cobertura de entregas</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-[#2C2825] mb-2">
                Modalidades de servicio disponibles *
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D9] text-xs cursor-pointer hover:border-[#D1C6BA]">
                  <input
                    type="checkbox"
                    checked={allowsDelivery}
                    onChange={(e) => setAllowsDelivery(e.target.checked)}
                    className="rounded text-[#B25E5C] focus:ring-[#B25E5C]"
                  />
                  <div>
                    <span className="font-medium text-[#2C2825]">Entrega a domicilio</span>
                    <p className="text-[11px] text-[#7A736E]">Reparto propio o servicio de mensajería local</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D9] text-xs cursor-pointer hover:border-[#D1C6BA]">
                  <input
                    type="checkbox"
                    checked={allowsPickup}
                    onChange={(e) => setAllowsPickup(e.target.checked)}
                    className="rounded text-[#B25E5C] focus:ring-[#B25E5C]"
                  />
                  <div>
                    <span className="font-medium text-[#2C2825]">Recolección en taller o local</span>
                    <p className="text-[11px] text-[#7A736E]">El cliente recoge directamente en tu dirección</p>
                  </div>
                </label>
              </div>
              {errors.delivery && <p className="text-[11px] text-rose-600 mt-1">{errors.delivery}</p>}
            </div>

            {allowsDelivery && (
              <div>
                <label className="block text-xs font-medium text-[#2C2825] mb-2">
                  Municipios de Tlaxcala donde ofreces entrega a domicilio *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {communities.map((comm) => {
                    const isChecked = deliveryCoverage.includes(comm.id);
                    return (
                      <button
                        type="button"
                        key={comm.id}
                        onClick={() => handleToggleCoverage(comm.id)}
                        className={`p-2.5 rounded-xl border text-xs text-left transition-colors flex items-center justify-between cursor-pointer ${
                          isChecked
                            ? 'bg-[#FAF0ED] border-[#B25E5C] text-[#8C3D38] font-medium'
                            : 'bg-[#FAF8F5] border-[#EAE3D9] text-[#5C534E] hover:border-[#D1C6BA]'
                        }`}
                      >
                        <span className="truncate">{comm.name}</span>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-[#B25E5C] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {errors.coverage && <p className="text-[11px] text-rose-600 mt-1">{errors.coverage}</p>}
              </div>
            )}
          </div>

          {/* SECCIÓN 4: Términos y Envío */}
          <div className="space-y-4 pt-6 border-t border-[#EAE3D9]">
            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE3D9] text-xs text-[#665E58] space-y-2">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-[#B25E5C] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#2C2825]">Compromiso de calidad Lunaria:</strong>
                  <p className="text-[11px] mt-0.5">
                    Las florerías en Lunaria se comprometen a utilizar flores frescas, respetar los horarios de entrega pactados y responder oportunamente los pedidos generados por clientes.
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-2 pt-2 border-t border-[#EAE3D9] cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="rounded text-[#B25E5C] focus:ring-[#B25E5C] mt-0.5"
                />
                <span className="text-[11px] text-[#2C2825]">
                  He leído y acepto los términos de servicio, aviso de privacidad y políticas de incorporación de florerías para el estado de Tlaxcala.
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.acceptTerms}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-xs text-[#8A8179]">
                * Tu solicitud iniciará en estado <strong className="text-[#2C2825]">Pendiente de revisión</strong>.
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3 bg-[#B25E5C] hover:bg-[#9E4D48] text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span>Registrando solicitud...</span>
                ) : (
                  <>
                    <span>Enviar solicitud de florería</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
