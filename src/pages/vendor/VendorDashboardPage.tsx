import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { repository } from '../../services/repository';
import { Florist, Order, ProductOffer, OrderStatus, FloristApplication, ApplicationAuditLog } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { generateWhatsAppOrderUrl } from '../../utils/whatsapp';
import {
  Store,
  DollarSign,
  Package,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  MessageCircle,
  Truck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  XCircle,
  FileText,
  MapPin,
  Calendar,
  Send,
  RefreshCw,
  Lock,
} from 'lucide-react';

export const VendorDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [florist, setFlorist] = useState<Florist | null>(null);
  const [application, setApplication] = useState<FloristApplication | null>(null);
  const [auditLogs, setAuditLogs] = useState<ApplicationAuditLog[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [offers, setOffers] = useState<ProductOffer[]>([]);
  const [loading, setLoading] = useState(true);

  // Clarification form state (for info_required)
  const [clarificationNotes, setClarificationNotes] = useState('');
  const [updatedAddress, setUpdatedAddress] = useState('');
  const [updatedPhone, setUpdatedPhone] = useState('');
  const [updatedDescription, setUpdatedDescription] = useState('');
  const [submittingClarification, setSubmittingClarification] = useState(false);
  const [clarificationSuccess, setClarificationSuccess] = useState(false);

  const floristId = currentUser.floristId || 'flor-1';

  const loadVendorData = async () => {
    setLoading(true);
    try {
      const [fl, ords, offs] = await Promise.all([
        repository.getFloristById(floristId),
        repository.getOrders({ floristId }),
        repository.getProductOffers({ floristId }),
      ]);
      setFlorist(fl);
      setOrders(ords);
      setOffers(offs);

      if (fl) {
        setUpdatedAddress(fl.address || '');
        setUpdatedPhone(fl.phone || '');
        setUpdatedDescription(fl.description || '');

        const app = await repository.getFloristApplicationByFloristId(fl.id);
        setApplication(app);
        if (app) {
          const logs = await repository.getApplicationAuditLogs(app.id);
          setAuditLogs(logs);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendorData();
  }, [floristId]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    await repository.updateOrderStatus(
      orderId,
      newStatus,
      `${florist?.orderAgentName || 'Florista'} (Taller)`,
      `Estado actualizado desde el panel de control de ${florist?.commercialName}.`
    );
    const updated = await repository.getOrders({ floristId });
    setOrders(updated);
  };

  const handleSendClarification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;

    setSubmittingClarification(true);
    try {
      await repository.updateFloristApplicationData(
        application.id,
        {
          address: updatedAddress.trim(),
          phone: updatedPhone.trim(),
          description: updatedDescription.trim(),
        },
        clarificationNotes.trim() || 'El florista actualizó los datos solicitados por la administración.'
      );
      setClarificationSuccess(true);
      await loadVendorData();
    } finally {
      setSubmittingClarification(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-[#8A8179]">
        Cargando información del taller floral...
      </div>
    );
  }

  // ==========================================
  // ESTADO 1: PENDIENTE DE REVISIÓN (Escenario A)
  // ==========================================
  if (florist?.status === 'pending_review' || florist?.status === 'draft') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Banner de Estado */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/60 px-2.5 py-0.5 rounded-full">
                  {florist.status === 'draft' ? 'Borrador' : 'En proceso de verificación'}
                </span>
                <span className="text-xs text-amber-700">
                  Modalidad: <strong>{florist.registrationMethod === 'invitation' ? 'Invitación Oficial' : 'Solicitud Pública'}</strong>
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-amber-950">
                Tu solicitud de florería está en revisión
              </h1>
              <p className="text-xs sm:text-sm text-amber-900/80 leading-relaxed">
                Hemos recibido el registro de <strong>{florist.commercialName}</strong>. El equipo administrativo de Lunaria está validando la información de contacto y cobertura en Tlaxcala para habilitar tu catálogo.
              </p>
            </div>
          </div>

          {/* Bloqueo explícito requerido por especificación */}
          <div className="p-3 bg-amber-100/60 rounded-xl border border-amber-300/60 flex items-center gap-2.5 text-xs text-amber-900">
            <Lock className="w-4 h-4 shrink-0 text-amber-700" />
            <span>
              <strong>Funciones restringidas temporalmente:</strong> No puedes publicar productos, recibir pedidos ni aparecer en el catálogo público hasta que tu taller sea aprobado.
            </span>
          </div>
        </div>

        {/* Línea de tiempo visual del proceso */}
        <div className="bg-white rounded-2xl border border-[#EAE3D9] p-6 shadow-xs space-y-6">
          <h2 className="font-serif text-lg font-semibold text-[#2C2825] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#B25E5C]" />
            <span>Línea de tiempo de incorporación a Lunaria</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Paso 1 */}
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between text-emerald-800">
                <span className="text-xs font-bold uppercase tracking-wider">Paso 1: Enviado</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <h4 className="font-medium text-xs text-[#2C2825]">Registro de Florería</h4>
              <p className="text-[11px] text-[#665E58]">
                Completado mediante {florist.registrationMethod === 'invitation' ? 'token de invitación' : 'solicitud pública'}.
              </p>
            </div>

            {/* Paso 2 */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-300 space-y-2 relative">
              <div className="flex items-center justify-between text-amber-800">
                <span className="text-xs font-bold uppercase tracking-wider">Paso 2: En curso</span>
                <Clock className="w-4 h-4 text-amber-600 animate-spin" />
              </div>
              <h4 className="font-medium text-xs text-amber-950">Validación Editorial</h4>
              <p className="text-[11px] text-amber-900/80">
                Verificación de teléfono, WhatsApp de pedidos y zonas de entrega en Tlaxcala.
              </p>
            </div>

            {/* Paso 3 */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE3D9] space-y-2 opacity-60">
              <div className="flex items-center justify-between text-[#8A8179]">
                <span className="text-xs font-bold uppercase tracking-wider">Paso 3: Próximo</span>
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="font-medium text-xs text-[#2C2825]">Publicación y Ventas</h4>
              <p className="text-[11px] text-[#7A736E]">
                Acceso completo al panel, publicación de ramos y recepción de pedidos directos.
              </p>
            </div>
          </div>
        </div>

        {/* Resumen de los datos enviados */}
        <div className="bg-white rounded-2xl border border-[#EAE3D9] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE4]">
            <h3 className="font-serif text-base font-semibold text-[#2C2825]">
              Ficha de registro de tu florería
            </h3>
            <span className="text-xs text-[#8A8179]">ID: {florist.id}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[#8A8179] block">Nombre comercial:</span>
              <strong className="text-[#2C2825]">{florist.commercialName}</strong>
            </div>
            <div>
              <span className="text-[#8A8179] block">Responsable de pedidos:</span>
              <strong className="text-[#2C2825]">{florist.orderAgentName}</strong>
            </div>
            <div>
              <span className="text-[#8A8179] block">Teléfono / WhatsApp:</span>
              <span className="text-[#2C2825]">{florist.phone} · WA: {florist.whatsapp}</span>
            </div>
            <div>
              <span className="text-[#8A8179] block">Dirección en Tlaxcala:</span>
              <span className="text-[#2C2825]">{florist.address}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[#8A8179] block">Descripción botánica:</span>
              <p className="text-[#665E58] mt-0.5">{florist.description}</p>
            </div>
          </div>
        </div>

        {/* Historial de Auditoría */}
        {auditLogs.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#EAE3D9] p-6 shadow-xs space-y-3">
            <h3 className="font-serif text-sm font-semibold text-[#2C2825]">
              Historial de actividades administrativas
            </h3>
            <div className="space-y-2 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D9] flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="font-medium text-[#2C2825]">{log.action.replace('_', ' ').toUpperCase()}</span>
                    <span className="text-[#8A8179] ml-2">por {log.actorName}</span>
                    {log.notes && <p className="text-[11px] text-[#665E58] mt-0.5">{log.notes}</p>}
                  </div>
                  <span className="text-[11px] text-[#8A8179] shrink-0">
                    {new Date(log.createdAt).toLocaleDateString('es-MX')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // ESTADO 2: INFORMACIÓN REQUERIDA (Escenario B)
  // ==========================================
  if (florist?.status === 'info_required') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Banner de Solicitud de Información por Admin */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200 px-2.5 py-0.5 rounded-full">
                Acción Requerida del Vendedor
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-amber-950">
                Se requiere información adicional para aprobar tu florería
              </h1>
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                La administración de Lunaria ha revisado tu solicitud de <strong>{florist.commercialName}</strong> y necesita que aclares o completes algunos detalles antes de activar tu cuenta.
              </p>
            </div>
          </div>

          {/* Notas del Administrador */}
          <div className="bg-white rounded-xl p-4 border border-amber-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">
              Mensaje del Administrador:
            </span>
            <p className="text-xs text-[#2C2825] font-medium leading-relaxed">
              "{florist.infoRequiredNotes || application?.infoRequiredNotes || 'Por favor confirma tu dirección física exacta y tu número de WhatsApp para pruebas de recepción de pedidos.'}"
            </p>
          </div>
        </div>

        {clarificationSuccess && (
          <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              <strong>¡Información enviada con éxito!</strong> Tu solicitud ha vuelto al estado <strong>Pendiente de revisión</strong> y el administrador ha sido notificado.
            </span>
          </div>
        )}

        {/* Formulario de Aclaración y Actualización */}
        <div className="bg-white rounded-3xl border border-[#EAE3D9] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#EAE3D9] pb-4">
            <h2 className="font-serif text-xl font-semibold text-[#2C2825]">
              Actualizar datos solicitados
            </h2>
            <p className="text-xs text-[#7A736E] mt-0.5">
              Edita los campos señalados por la administración y envía tu respuesta.
            </p>
          </div>

          <form onSubmit={handleSendClarification} className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-[#2C2825] mb-1">
                Respuesta o aclaraciones para el administrador *
              </label>
              <textarea
                rows={3}
                placeholder="Explica aquí los cambios realizados o añade las aclaraciones solicitadas..."
                value={clarificationNotes}
                onChange={(e) => setClarificationNotes(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl focus:ring-[#B25E5C] focus:border-[#B25E5C]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#2C2825] mb-1">
                  Dirección física actualizada
                </label>
                <input
                  type="text"
                  value={updatedAddress}
                  onChange={(e) => setUpdatedAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2C2825] mb-1">
                  Teléfono de contacto
                </label>
                <input
                  type="tel"
                  value={updatedPhone}
                  onChange={(e) => setUpdatedPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2C2825] mb-1">
                Descripción comercial de la florería
              </label>
              <textarea
                rows={2}
                value={updatedDescription}
                onChange={(e) => setUpdatedDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAE3D9]">
              <button
                type="submit"
                disabled={submittingClarification}
                className="px-6 py-2.5 bg-[#B25E5C] hover:bg-[#9E4D48] text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {submittingClarification ? (
                  <span>Guardando...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar información actualizada</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // ESTADO 3: RECHAZADO (Escenario C - Roberto Vega)
  // ==========================================
  if (florist?.status === 'rejected') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-700 mx-auto flex items-center justify-center">
            <XCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-200/60 px-3 py-1 rounded-full">
              Solicitud No Aprobada
            </span>
            <h1 className="font-serif text-3xl font-semibold text-rose-950">
              {florist.commercialName}
            </h1>
            <p className="text-xs text-rose-900/80 max-w-md mx-auto">
              Lamentamos informarte que tu solicitud de registro para vender en Lunaria no fue aprobada por el comité de evaluación.
            </p>
          </div>

          {/* Motivo de Rechazo Oficial */}
          <div className="bg-white rounded-2xl p-5 border border-rose-200 text-left text-xs max-w-lg mx-auto space-y-2 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#F2ECE4] pb-2">
              <span className="font-bold text-rose-900">Motivo del rechazo:</span>
              <span className="text-[11px] text-[#8A8179]">
                {florist.rejectedAt ? new Date(florist.rejectedAt).toLocaleDateString('es-MX') : 'Reciente'}
              </span>
            </div>
            <p className="text-[#2C2825] leading-relaxed">
              {florist.rejectionReason || 'No se pudo verificar la cobertura dentro de los municipios activos de Tlaxcala o los requisitos de calidad floral.'}
            </p>
          </div>

          {/* Opciones de contacto y re-solicitud */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://wa.me/522461234567?text=Hola%20Lunaria%20Tlaxcala,%20tengo%20dudas%20sobre%20mi%20solicitud%20rechazada"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 bg-white border border-rose-300 text-rose-800 text-xs font-medium rounded-xl hover:bg-rose-100/50 transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Contactar a Soporte Lunaria por WhatsApp</span>
            </a>
            <Link
              to="/vende-con-nosotros"
              className="w-full sm:w-auto px-5 py-2.5 bg-[#B25E5C] text-white text-xs font-medium rounded-xl hover:bg-[#9E4D48] transition-colors"
            >
              Iniciar nueva solicitud
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ESTADO 4: SUSPENDIDO (Escenario C - Lucía Valdés)
  // ==========================================
  if (florist?.status === 'suspended') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-8 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-200 text-rose-800 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-200 px-2.5 py-0.5 rounded-full">
                Operaciones Suspendidas
              </span>
              <h1 className="font-serif text-3xl font-semibold text-rose-950">
                Florería temporalmente fuera de servicio en Lunaria
              </h1>
              <p className="text-xs text-rose-900 leading-relaxed">
                Las operaciones comerciales de <strong>{florist.commercialName}</strong> han sido pausadas por la administración.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-rose-200 text-xs space-y-2">
            <div className="font-bold text-rose-900">Motivo de suspensión administrativa:</div>
            <p className="text-[#2C2825] leading-relaxed">
              "{florist.suspensionReason || 'Reportes de retrasos reiterados en entregas o inconsistencia de inventario.'}"
            </p>
            <div className="pt-2 text-[11px] text-[#8A8179] border-t border-[#F2ECE4]">
              Fecha de aplicación: {florist.suspendedAt ? new Date(florist.suspendedAt).toLocaleDateString('es-MX') : 'Reciente'}
            </div>
          </div>

          <div className="p-3 bg-rose-100 rounded-xl text-xs text-rose-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-700 shrink-0" />
            <span>
              Tus productos no se muestran en el catálogo y no puedes recibir nuevos pedidos hasta que la suspensión sea levantada.
            </span>
          </div>

          <div className="pt-2 flex justify-end">
            <a
              href="https://wa.me/522461234567?text=Aclaración%20de%20suspensión%20en%20Lunaria%20Tlaxcala"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-[#2C2825] text-white text-xs font-medium rounded-xl hover:bg-black transition-colors flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Aclarar suspensión con la administración</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ESTADO 5: APROBADO (Dashboard Completo)
  // ==========================================
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((acc, o) => acc + o.totalAmount, 0);

  const pendingCount = orders.filter(
    (o) => o.status === 'pending_contact' || o.status === 'contacted'
  ).length;

  const inPrepCount = orders.filter(
    (o) => o.status === 'in_preparation' || o.status === 'confirmed_by_vendor'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#EAE3D9] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5A735E]">
              Panel de Control Floral
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-medium px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Florería Aprobada y Activa
            </span>
            {florist?.registrationMethod === 'invitation' && (
              <span className="text-[10px] bg-indigo-50 text-indigo-800 font-medium px-2 py-0.5 rounded border border-indigo-200">
                Vía Invitación
              </span>
            )}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2C2825] mt-1">
            {florist?.commercialName}
          </h1>
          <p className="text-xs text-[#7A736E] mt-0.5">
            Responsable: <strong>{florist?.orderAgentName}</strong> · WhatsApp:{' '}
            <strong>{florist?.whatsapp}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/vendedor/producto/nuevo"
            className="px-4 py-2 bg-[#B25E5C] text-white text-xs font-semibold rounded-xl hover:bg-[#9E4D48] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publicar Arreglo</span>
          </Link>

          <Link
            to="/vendedor/floreria"
            className="px-3.5 py-2 bg-white text-[#5C534E] border border-[#EAE3D9] text-xs font-medium rounded-xl hover:bg-[#FAF8F5] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Store className="w-3.5 h-3.5 text-[#B25E5C]" />
            <span>Ver Perfil Comercial</span>
          </Link>
        </div>
      </div>

      {/* 4 Métricas Principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#EAE3D9] shadow-xs">
          <div className="flex items-center justify-between text-[#8A8179] mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Ventas Estimadas</span>
            <DollarSign className="w-4 h-4 text-[#B25E5C]" />
          </div>
          <div className="font-serif text-2xl font-bold text-[#2C2825]">
            ${totalRevenue.toLocaleString('es-MX')} MXN
          </div>
          <div className="text-[11px] text-[#7A736E] mt-1">
            {orders.length} pedidos registrados
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#EAE3D9] shadow-xs">
          <div className="flex items-center justify-between text-[#8A8179] mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Por Confirmar</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-[#2C2825]">{pendingCount}</div>
          <div className="text-[11px] text-[#7A736E] mt-1">Clientes esperando contacto</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#EAE3D9] shadow-xs">
          <div className="flex items-center justify-between text-[#8A8179] mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">En Preparación</span>
            <Sparkles className="w-4 h-4 text-[#5A735E]" />
          </div>
          <div className="font-serif text-2xl font-bold text-[#2C2825]">{inPrepCount}</div>
          <div className="text-[11px] text-[#7A736E] mt-1">Armándose en taller</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#EAE3D9] shadow-xs">
          <div className="flex items-center justify-between text-[#8A8179] mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Catálogo Activo</span>
            <Package className="w-4 h-4 text-[#7A6953]" />
          </div>
          <div className="font-serif text-2xl font-bold text-[#2C2825]">
            {offers.filter((o) => o.isPublished).length}
          </div>
          <div className="text-[11px] text-[#7A736E] mt-1">de {offers.length} ofertas totales</div>
        </div>
      </div>

      {/* Acciones directas de gestión */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/vendedor/pedidos"
          className="p-5 bg-white rounded-2xl border border-[#EAE3D9] hover:border-[#B25E5C] transition-colors group flex items-center justify-between"
        >
          <div>
            <h3 className="font-serif text-base font-semibold text-[#2C2825] group-hover:text-[#B25E5C] transition-colors">
              Gestionar Pedidos ({orders.length})
            </h3>
            <p className="text-xs text-[#7A736E] mt-0.5">
              Revisa comprobantes, cambia estados y envía confirmación por WhatsApp.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#B25E5C] transition-colors" />
        </Link>

        <Link
          to="/vendedor/productos"
          className="p-5 bg-white rounded-2xl border border-[#EAE3D9] hover:border-[#B25E5C] transition-colors group flex items-center justify-between"
        >
          <div>
            <h3 className="font-serif text-base font-semibold text-[#2C2825] group-hover:text-[#B25E5C] transition-colors">
              Catálogo y Precios ({offers.length})
            </h3>
            <p className="text-xs text-[#7A736E] mt-0.5">
              Ajusta tus precios locales, stock disponible y tiempo de entrega.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#B25E5C] transition-colors" />
        </Link>

        <Link
          to="/vendedor/entregas"
          className="p-5 bg-white rounded-2xl border border-[#EAE3D9] hover:border-[#B25E5C] transition-colors group flex items-center justify-between"
        >
          <div>
            <h3 className="font-serif text-base font-semibold text-[#2C2825] group-hover:text-[#B25E5C] transition-colors">
              Zonas de Entrega
            </h3>
            <p className="text-xs text-[#7A736E] mt-0.5">
              Cobertura en {florist?.deliveryCoverage?.length || 0} municipios de Tlaxcala.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#B25E5C] transition-colors" />
        </Link>
      </div>

      {/* Pedidos recientes */}
      <div className="bg-white rounded-3xl p-6 border border-[#EAE3D9] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-[#EAE3D9]">
          <h2 className="font-serif text-xl font-semibold text-[#2C2825]">
            Pedidos Recientes para {florist?.commercialName}
          </h2>
          <Link
            to="/vendedor/pedidos"
            className="text-xs font-semibold text-[#B25E5C] hover:underline"
          >
            Ver todos los pedidos →
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#8A8179]">
            Aún no has recibido pedidos. Los nuevos pedidos de clientes aparecerán aquí automáticamente.
          </div>
        ) : (
          <div className="divide-y divide-[#F2ECE4]">
            {orders.slice(0, 5).map((order) => {
              const waUrl = generateWhatsAppOrderUrl(order);
              return (
                <div
                  key={order.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#2C2825]">
                        #{order.id.slice(-6).toUpperCase()}
                      </span>
                      <StatusBadge status={order.status} />
                      <span className="text-[11px] text-[#8A8179]">
                        {new Date(order.createdAt).toLocaleDateString('es-MX')}
                      </span>
                    </div>
                    <div className="text-xs text-[#2C2825]">
                      Cliente: <strong>{order.buyerName}</strong> ({order.buyerPhone})
                    </div>
                    <div className="text-[11px] text-[#7A736E]">
                      {order.items.length} arreglo(s) · {order.deliveryMethod === 'delivery' ? 'Domicilio' : 'Recolección'} ·{' '}
                      <strong>${order.totalAmount.toLocaleString('es-MX')} MXN</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-[#25D366] text-white text-xs font-medium rounded-lg hover:bg-[#20ba59] transition-colors flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      className="text-xs px-2.5 py-1.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-lg text-[#2C2825]"
                    >
                      <option value="pending_contact">Pendiente contacto</option>
                      <option value="contacted">Contactado</option>
                      <option value="confirmed_by_vendor">Confirmado</option>
                      <option value="in_preparation">En preparación</option>
                      <option value="ready_for_pickup">Listo para entrega</option>
                      <option value="out_for_delivery">En ruta</option>
                      <option value="delivered">Entregado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
