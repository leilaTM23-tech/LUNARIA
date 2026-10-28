import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { repository } from '../../services/repository';
import {
  Florist,
  FloristStatus,
  FloristApplication,
  FloristInvitation,
  ApplicationAuditLog,
  Community,
  RegistrationMethod,
} from '../../types';
import {
  Store,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  MessageCircle,
  Mail,
  Ticket,
  Plus,
  Search,
  Filter,
  Eye,
  Send,
  RotateCcw,
  Clock,
  ShieldCheck,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Ban,
  UserCheck,
} from 'lucide-react';

type AdminTab = 'applications' | 'invitations' | 'approved' | 'suspended_rejected';

export const AdminFloristsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('applications');
  const [loading, setLoading] = useState(true);

  // Data
  const [florists, setFlorists] = useState<Florist[]>([]);
  const [applications, setApplications] = useState<FloristApplication[]>([]);
  const [invitations, setInvitations] = useState<FloristInvitation[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [communityFilter, setCommunityFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Detail Modal
  const [selectedApplication, setSelectedApplication] = useState<FloristApplication | null>(null);
  const [selectedAuditLogs, setSelectedAuditLogs] = useState<ApplicationAuditLog[]>([]);

  // Action Modals State
  const [actionType, setActionType] = useState<'approve' | 'request_info' | 'reject' | 'suspend' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionTargetFloristId, setActionTargetFloristId] = useState<string | null>(null);

  // New Invitation Modal
  const [showNewInviteModal, setShowNewInviteModal] = useState(false);
  const [inviteBusinessName, setInviteBusinessName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDays, setInviteDays] = useState(7);
  const [createdInviteLink, setCreatedInviteLink] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [flList, appList, invList, commList] = await Promise.all([
        repository.getFlorists(),
        repository.getFloristApplications(),
        repository.getFloristInvitations(),
        repository.getCommunities(),
      ]);
      setFlorists(flList);
      setApplications(appList);
      setInvitations(invList);
      setCommunities(commList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // Open Application Detail Modal
  const handleViewApplication = async (app: FloristApplication) => {
    setSelectedApplication(app);
    const logs = await repository.getApplicationAuditLogs(app.id);
    setSelectedAuditLogs(logs);
  };

  // Execute Admin Action
  const handleExecuteAction = async () => {
    if (!actionType || !actionTargetFloristId) return;

    const actorId = currentUser.id;
    const actorName = currentUser.fullName;

    if (actionType === 'approve') {
      await repository.updateFloristStatus(actionTargetFloristId, 'approved', {
        adminNotes: actionNotes || 'Florería aprobada con revisión completa de requisitos.',
        actorId,
        actorName,
      });
      showNotification('Florería aprobada y activada con éxito en el catálogo de Tlaxcala.');
    } else if (actionType === 'request_info') {
      if (!actionNotes.trim()) {
        alert('Por favor especifica qué información adicional necesita enviar la florería.');
        return;
      }
      await repository.updateFloristStatus(actionTargetFloristId, 'info_required', {
        adminNotes: actionNotes.trim(),
        actorId,
        actorName,
      });
      showNotification('Se envió el requerimiento de información adicional al florista.');
    } else if (actionType === 'reject') {
      if (!actionNotes.trim()) {
        alert('Debes indicar el motivo de rechazo oficial.');
        return;
      }
      await repository.updateFloristStatus(actionTargetFloristId, 'rejected', {
        rejectionReason: actionNotes.trim(),
        actorId,
        actorName,
      });
      showNotification('Solicitud de florería rechazada y archivada con motivo formal.');
    } else if (actionType === 'suspend') {
      if (!actionNotes.trim()) {
        alert('Debes indicar el motivo de la suspensión administrativa.');
        return;
      }
      await repository.updateFloristStatus(actionTargetFloristId, 'suspended', {
        suspensionReason: actionNotes.trim(),
        actorId,
        actorName,
      });
      showNotification('Florería suspendida temporalmente de la plataforma.');
    }

    // Reset modals and reload
    setActionType(null);
    setActionNotes('');
    setActionTargetFloristId(null);
    setSelectedApplication(null);
    await loadAllData();
  };

  // Quick Reactivate Suspended Florist
  const handleReactivateFlorist = async (floristId: string) => {
    await repository.updateFloristStatus(floristId, 'approved', {
      adminNotes: 'Suspensión levantada por el administrador tras revisión.',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
    });
    showNotification('Florería reactivada con éxito.');
    await loadAllData();
  };

  // Create Invitation
  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteBusinessName.trim() || !inviteEmail.trim()) return;

    const newInv = await repository.createFloristInvitation({
      businessName: inviteBusinessName.trim(),
      email: inviteEmail.trim().toLowerCase(),
      expiresInDays: Number(inviteDays) || 7,
      createdById: currentUser.id,
      createdByName: currentUser.fullName,
    });

    const fullUrl = `${window.location.origin}/invitacion/${newInv.token}`;
    setCreatedInviteLink(fullUrl);
    setInviteBusinessName('');
    setInviteEmail('');
    await loadAllData();
    showNotification('Invitación creada exitosamente.');
  };

  // Revoke Invitation
  const handleRevokeInvitation = async (invitationId: string) => {
    if (window.confirm('¿Deseas revocar esta invitación? El token ya no podrá ser utilizado.')) {
      await repository.revokeFloristInvitation(invitationId);
      showNotification('Invitación revocada con éxito.');
      await loadAllData();
    }
  };

  // Copy token link helper
  const handleCopyLink = (token: string) => {
    const fullUrl = `${window.location.origin}/invitacion/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Counts for tabs
  const pendingAppsCount = applications.filter(
    (a) => a.status === 'pending_review' || a.status === 'info_required'
  ).length;

  const activeInvitationsCount = invitations.filter((i) => i.status === 'pending').length;
  const approvedCount = florists.filter((f) => f.status === 'approved').length;
  const suspendedRejectedCount = florists.filter(
    (f) => f.status === 'suspended' || f.status === 'rejected'
  ).length;

  // Filtered applications
  const filteredApplications = applications.filter((app) => {
    const q = searchQuery.toLowerCase();
    const commercialName = app.commercialName || app.businessName || '';
    const orderAgentName = app.orderAgentName || app.applicantName || '';
    const email = app.email || app.applicantEmail || '';

    const matchesSearch =
      !q ||
      commercialName.toLowerCase().includes(q) ||
      orderAgentName.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q);

    const matchesComm = communityFilter === 'all' || app.communityId === communityFilter;
    const matchesMethod = methodFilter === 'all' || app.registrationMethod === methodFilter;
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

    return matchesSearch && matchesComm && matchesMethod && matchesStatus;
  });

  // Filtered Approved Florists
  const filteredApprovedFlorists = florists
    .filter((f) => f.status === 'approved')
    .filter((f) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        f.commercialName.toLowerCase().includes(q) ||
        f.orderAgentName.toLowerCase().includes(q) ||
        (f.email || '').toLowerCase().includes(q);
      const matchesComm = communityFilter === 'all' || f.communityId === communityFilter;
      const matchesMethod = methodFilter === 'all' || f.registrationMethod === methodFilter;
      return matchesSearch && matchesComm && matchesMethod;
    });

  // Filtered Suspended/Rejected Florists
  const filteredSuspendedRejected = florists
    .filter((f) => f.status === 'suspended' || f.status === 'rejected')
    .filter((f) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        f.commercialName.toLowerCase().includes(q) ||
        f.orderAgentName.toLowerCase().includes(q);
      return matchesSearch;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Encabezado */}
      <div className="pb-6 border-b border-[#EAE3D9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#8C3D38] mb-1">
            Supervisión Administrativa
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2C2825]">
            Gestión y Registro de Florerías
          </h1>
          <p className="text-xs text-[#7A736E] mt-1">
            Sistema mixto de incorporación: invitaciones con tokens únicos y solicitudes públicas en Tlaxcala.
          </p>
        </div>

        {notice && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
        )}
      </div>

      {/* Tabs Principales */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#EAE3D9] pb-2 text-xs font-medium">
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'applications'
              ? 'bg-[#B25E5C] text-white font-semibold shadow-xs'
              : 'bg-white text-[#5C534E] hover:bg-[#FAF8F5] border border-[#EAE3D9]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Solicitudes de Registro</span>
          {pendingAppsCount > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'applications' ? 'bg-white text-[#B25E5C]' : 'bg-[#FAF0ED] text-[#B25E5C]'
              }`}
            >
              {pendingAppsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('invitations')}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'invitations'
              ? 'bg-[#B25E5C] text-white font-semibold shadow-xs'
              : 'bg-white text-[#5C534E] hover:bg-[#FAF8F5] border border-[#EAE3D9]'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Invitaciones Oficiales</span>
          {activeInvitationsCount > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'invitations' ? 'bg-white text-[#B25E5C]' : 'bg-indigo-50 text-indigo-700'
              }`}
            >
              {activeInvitationsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'approved'
              ? 'bg-[#B25E5C] text-white font-semibold shadow-xs'
              : 'bg-white text-[#5C534E] hover:bg-[#FAF8F5] border border-[#EAE3D9]'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Florerías Aprobadas ({approvedCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('suspended_rejected')}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'suspended_rejected'
              ? 'bg-[#B25E5C] text-white font-semibold shadow-xs'
              : 'bg-white text-[#5C534E] hover:bg-[#FAF8F5] border border-[#EAE3D9]'
          }`}
        >
          <Ban className="w-4 h-4" />
          <span>Suspendidas y Rechazadas ({suspendedRejectedCount})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: SOLICITUDES DE REGISTRO */}
      {/* ========================================================= */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          {/* Barra de filtros */}
          <div className="bg-white p-4 rounded-2xl border border-[#EAE3D9] flex flex-wrap items-center gap-3 text-xs">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por florería, responsable o correo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl focus:ring-[#B25E5C] focus:border-[#B25E5C]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-[#2C2825]"
            >
              <option value="all">Todos los estados</option>
              <option value="pending_review">Pendiente de revisión</option>
              <option value="info_required">Información requerida</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-2 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-[#2C2825]"
            >
              <option value="all">Todas las modalidades</option>
              <option value="invitation">Por Invitación</option>
              <option value="public_application">Solicitud Pública</option>
            </select>

            <select
              value={communityFilter}
              onChange={(e) => setCommunityFilter(e.target.value)}
              className="px-3 py-2 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-[#2C2825]"
            >
              <option value="all">Todas las comunidades</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tabla de solicitudes */}
          {loading ? (
            <div className="py-20 text-center text-xs text-[#8A8179]">Cargando solicitudes...</div>
          ) : filteredApplications.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE3D9] max-w-md mx-auto space-y-3">
              <FileText className="w-8 h-8 text-[#8A8179] mx-auto" />
              <h3 className="font-serif text-lg font-semibold text-[#2C2825]">
                No se encontraron solicitudes
              </h3>
              <p className="text-xs text-[#7A736E]">
                No hay registros con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#EAE3D9] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] border-b border-[#EAE3D9] text-[#7A736E] uppercase font-semibold text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Florería & Responsable</th>
                      <th className="py-3 px-4">Modalidad</th>
                      <th className="py-3 px-4">Comunidad</th>
                      <th className="py-3 px-4">Fecha Solicitud</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2ECE4]">
                    {filteredApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#2C2825]">
                            {app.commercialName || app.businessName}
                          </div>
                          <div className="text-[11px] text-[#7A736E]">
                            {app.orderAgentName || app.applicantName} · {app.email || app.applicantEmail}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {app.registrationMethod === 'invitation' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Ticket className="w-3 h-3" />
                              Invitación
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <Store className="w-3 h-3" />
                              Solicitud Pública
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-[#5C534E]">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#B25E5C]" />
                            <span>{app.communityName || 'Tlaxcala'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#7A736E]">
                          {new Date(app.createdAt || app.submittedAt).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          {app.status === 'pending_review' && (
                            <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200">
                              Pendiente
                            </span>
                          )}
                          {app.status === 'info_required' && (
                            <span className="text-[10px] bg-purple-50 text-purple-800 font-bold px-2 py-0.5 rounded border border-purple-200">
                              Info Requerida
                            </span>
                          )}
                          {app.status === 'approved' && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                              Aprobada
                            </span>
                          )}
                          {app.status === 'rejected' && (
                            <span className="text-[10px] bg-rose-50 text-rose-800 font-bold px-2 py-0.5 rounded border border-rose-200">
                              Rechazada
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleViewApplication(app)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-[#EAE3D9] hover:border-[#B25E5C] text-[#2C2825] hover:text-[#B25E5C] text-xs font-medium rounded-xl transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Revisar Expediente</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: INVITACIONES OFICIALES */}
      {/* ========================================================= */}
      {activeTab === 'invitations' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAE3D9]">
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#2C2825]">
                Invitaciones Únicas para Florerías
              </h2>
              <p className="text-xs text-[#7A736E] mt-0.5">
                Emite tokens criptográficos de un solo uso para invitar a floristerías reconocidas del estado de Tlaxcala.
              </p>
            </div>
            <button
              onClick={() => {
                setShowNewInviteModal(true);
                setCreatedInviteLink(null);
              }}
              className="px-4 py-2.5 bg-[#B25E5C] hover:bg-[#9E4D48] text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Invitación</span>
            </button>
          </div>

          {/* Tabla de invitaciones */}
          <div className="bg-white rounded-3xl border border-[#EAE3D9] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-[#EAE3D9] text-[#7A736E] uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Florería & Correo</th>
                    <th className="py-3 px-4">Token & Enlace</th>
                    <th className="py-3 px-4">Vencimiento</th>
                    <th className="py-3 px-4">Emitido por</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2ECE4]">
                  {invitations.map((inv) => {
                    const isExpired = new Date(inv.expiresAt) < new Date();
                    return (
                      <tr key={inv.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#2C2825]">{inv.businessName}</div>
                          <div className="text-[11px] text-[#7A736E]">{inv.email}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          <span className="text-[#8C3D38] bg-[#FAF0ED] px-2 py-0.5 rounded border border-[#F2DDD9]">
                            {inv.token}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#7A736E]">
                          {new Date(inv.expiresAt).toLocaleDateString('es-MX')}
                        </td>
                        <td className="py-3.5 px-4 text-[#5C534E]">{inv.createdByName}</td>
                        <td className="py-3.5 px-4">
                          {inv.status === 'used' ? (
                            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                              Utilizada
                            </span>
                          ) : inv.status === 'revoked' ? (
                            <span className="text-[10px] bg-rose-50 text-rose-800 font-bold px-2 py-0.5 rounded border border-rose-200">
                              Revocada
                            </span>
                          ) : isExpired ? (
                            <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200">
                              Vencida
                            </span>
                          ) : (
                            <span className="text-[10px] bg-indigo-50 text-indigo-800 font-bold px-2 py-0.5 rounded border border-indigo-200">
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          {inv.status === 'pending' && !isExpired && (
                            <>
                              <button
                                onClick={() => handleCopyLink(inv.token)}
                                title="Copiar enlace de invitación"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#EAE3D9] text-[#2C2825] rounded-lg hover:border-[#B25E5C] transition-colors cursor-pointer"
                              >
                                {copiedToken === inv.token ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-[#8A8179]" />
                                )}
                                <span>Copiar Enlace</span>
                              </button>
                              <button
                                onClick={() => handleRevokeInvitation(inv.id)}
                                title="Revocar invitación"
                                className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-rose-200 text-rose-700 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <span>Revocar</span>
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: FLORERÍAS APROBADAS */}
      {/* ========================================================= */}
      {activeTab === 'approved' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredApprovedFlorists.map((f) => (
              <div
                key={f.id}
                className="bg-white rounded-3xl p-6 border border-[#EAE3D9] shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-[#FAF0ED] text-[#B25E5C] flex items-center justify-center font-bold text-sm">
                        {f.commercialName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-serif text-lg font-semibold text-[#2C2825]">{f.commercialName}</h3>
                        <div className="text-[11px] text-[#7A736E]">Resp: {f.orderAgentName}</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                      Aprobada
                    </span>
                  </div>

                  <p className="text-xs text-[#665E58] line-clamp-3 leading-relaxed mt-2">
                    {f.description}
                  </p>

                  <div className="mt-3 pt-3 border-t border-[#F2ECE4] space-y-1.5 text-xs text-[#7A736E]">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#B25E5C] shrink-0 mt-0.5" />
                      <span>{f.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#5A735E]" />
                      <span>{f.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp: {f.whatsapp}</span>
                    </div>
                    <div className="text-[11px] text-[#8A8179] pt-1">
                      Modalidad:{' '}
                      <strong>{f.registrationMethod === 'invitation' ? 'Invitación' : 'Solicitud Pública'}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F2ECE4] flex items-center justify-between">
                  <a
                    href={`/floreria/${f.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#B25E5C] hover:underline flex items-center gap-1"
                  >
                    <span>Ver vitrina</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={() => {
                      setActionType('suspend');
                      setActionTargetFloristId(f.id);
                    }}
                    className="px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                  >
                    Suspender
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: SUSPENDIDAS Y RECHAZADAS */}
      {/* ========================================================= */}
      {activeTab === 'suspended_rejected' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSuspendedRejected.map((f) => (
              <div
                key={f.id}
                className="bg-white rounded-3xl p-6 border border-rose-200 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-[#2C2825]">{f.commercialName}</h3>
                    <div className="text-xs text-[#7A736E]">Resp: {f.orderAgentName} · {f.email}</div>
                  </div>
                  {f.status === 'suspended' ? (
                    <span className="text-[10px] bg-rose-50 text-rose-800 font-bold px-2.5 py-0.5 rounded border border-rose-200">
                      Suspendida
                    </span>
                  ) : (
                    <span className="text-[10px] bg-stone-100 text-stone-800 font-bold px-2.5 py-0.5 rounded border border-stone-300">
                      Rechazada
                    </span>
                  )}
                </div>

                <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EAE3D9] text-xs space-y-1">
                  <span className="font-semibold text-rose-900">Motivo administrativo registrado:</span>
                  <p className="text-[#2C2825]">
                    {f.suspensionReason || f.rejectionReason || 'No especificado.'}
                  </p>
                  <div className="text-[11px] text-[#8A8179] pt-1">
                    Fecha de acción: {f.suspendedAt || f.rejectedAt ? new Date((f.suspendedAt || f.rejectedAt)!).toLocaleDateString('es-MX') : 'Reciente'}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleReactivateFlorist(f.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Reactivar / Aprobar Florería</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EXPEDIENTE COMPLETO DE SOLICITUD */}
      {/* ========================================================= */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-[#EAE3D9] p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE3D9]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#B25E5C]">
                  Expediente de Florería
                </span>
                <h3 className="font-serif text-2xl font-semibold text-[#2C2825]">
                  {selectedApplication.commercialName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedApplication(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Datos Comerciales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D9]">
                <span className="text-[#8A8179] block">Responsable de Pedidos:</span>
                <strong className="text-[#2C2825]">{selectedApplication.orderAgentName}</strong>
              </div>
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D9]">
                <span className="text-[#8A8179] block">Modalidad de Incorporación:</span>
                <strong className="text-[#2C2825]">
                  {selectedApplication.registrationMethod === 'invitation'
                    ? 'Invitación Oficial'
                    : 'Solicitud Pública'}
                </strong>
              </div>
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D9]">
                <span className="text-[#8A8179] block">Correo:</span>
                <span className="text-[#2C2825]">{selectedApplication.email}</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D9]">
                <span className="text-[#8A8179] block">WhatsApp / Teléfono:</span>
                <span className="text-[#2C2825]">WA: {selectedApplication.whatsapp} · Tel: {selectedApplication.phone}</span>
              </div>
              <div className="sm:col-span-2 p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D9]">
                <span className="text-[#8A8179] block">Dirección en Tlaxcala:</span>
                <span className="text-[#2C2825]">{selectedApplication.address}</span>
              </div>
              <div className="sm:col-span-2 p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D9]">
                <span className="text-[#8A8179] block">Propuesta y Especialidad Floral:</span>
                <p className="text-[#665E58] mt-1">{selectedApplication.description}</p>
              </div>
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D9]">
                <span className="text-[#8A8179] block">Horarios de Atención:</span>
                <span className="text-[#2C2825]">{selectedApplication.openingHours}</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D9]">
                <span className="text-[#8A8179] block">Tiempo de Preparación:</span>
                <span className="text-[#2C2825]">{selectedApplication.prepTimeEstimated}</span>
              </div>
            </div>

            {/* Historial de Auditoría */}
            <div className="space-y-2">
              <h4 className="font-serif text-sm font-semibold text-[#2C2825]">
                Historial de Acciones y Auditoría
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {selectedAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 bg-[#FAF8F5] rounded-lg border border-[#EAE3D9] text-[11px] flex justify-between items-center"
                  >
                    <div>
                      <span className="font-semibold text-[#2C2825]">
                        {log.action.replace('_', ' ').toUpperCase()}
                      </span>{' '}
                      por <span className="text-[#8C3D38]">{log.actorName}</span>
                      {log.notes && <p className="text-[#7A736E] mt-0.5">{log.notes}</p>}
                    </div>
                    <span className="text-[#8A8179] text-[10px] shrink-0">
                      {new Date(log.createdAt).toLocaleDateString('es-MX')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones Administrativas */}
            <div className="pt-4 border-t border-[#EAE3D9] flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => {
                  setActionType('request_info');
                  setActionTargetFloristId(selectedApplication.floristId);
                }}
                className="px-3.5 py-2 bg-amber-50 text-amber-800 border border-amber-300 text-xs font-semibold rounded-xl hover:bg-amber-100 transition-colors cursor-pointer"
              >
                Solicitar Info Adicional
              </button>

              <button
                onClick={() => {
                  setActionType('reject');
                  setActionTargetFloristId(selectedApplication.floristId);
                }}
                className="px-3.5 py-2 bg-rose-50 text-rose-800 border border-rose-300 text-xs font-semibold rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
              >
                Rechazar
              </button>

              <button
                onClick={() => {
                  setActionType('approve');
                  setActionTargetFloristId(selectedApplication.floristId);
                }}
                className="px-5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
              >
                Aprobar Florería
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ACCIÓN CONTEXTUAL (Aprobar / Solicitar Info / Rechazar / Suspender) */}
      {/* ========================================================= */}
      {actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-[#EAE3D9] p-6 space-y-4">
            <h3 className="font-serif text-lg font-semibold text-[#2C2825]">
              {actionType === 'approve' && 'Confirmar Aprobación de Florería'}
              {actionType === 'request_info' && 'Solicitar Información Adicional al Florista'}
              {actionType === 'reject' && 'Indicar Motivo de Rechazo Formal'}
              {actionType === 'suspend' && 'Suspender Operaciones de Florería'}
            </h3>

            <p className="text-xs text-[#7A736E]">
              {actionType === 'approve' &&
                'La florería podrá publicar arreglos, aparecer en el catálogo de Tlaxcala y recibir pedidos.'}
              {actionType === 'request_info' &&
                'El estado cambiará a "Información requerida". El florista podrá actualizar su expediente desde su panel.'}
              {actionType === 'reject' &&
                'El motivo será visible para el solicitante en su pantalla de seguimiento.'}
              {actionType === 'suspend' &&
                'Se ocultarán sus productos del catálogo hasta que la suspensión sea revocada.'}
            </p>

            <div>
              <label className="block text-xs font-medium text-[#2C2825] mb-1">
                {actionType === 'approve' ? 'Notas internas (opcional):' : 'Comentarios / Motivo obligatorio:'}
              </label>
              <textarea
                rows={3}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={
                  actionType === 'request_info'
                    ? 'Ej. Favor de adjuntar comprobante de domicilio en Tlaxcala o confirmar el WhatsApp de atención.'
                    : actionType === 'reject'
                    ? 'Ej. La dirección se encuentra fuera de los municipios con cobertura activa en esta fase.'
                    : 'Detalles...'
                }
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl focus:ring-[#B25E5C]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAE3D9]">
              <button
                onClick={() => {
                  setActionType(null);
                  setActionNotes('');
                }}
                className="px-4 py-2 bg-white border border-[#EAE3D9] text-xs font-medium rounded-xl hover:bg-[#FAF8F5] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteAction}
                className={`px-5 py-2 text-white text-xs font-semibold rounded-xl cursor-pointer ${
                  actionType === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : actionType === 'request_info'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirmar Acción
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREAR NUEVA INVITACIÓN */}
      {/* ========================================================= */}
      {showNewInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-[#EAE3D9] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D9]">
              <h3 className="font-serif text-lg font-semibold text-[#2C2825]">
                Crear Invitación Exclusiva
              </h3>
              <button
                onClick={() => setShowNewInviteModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {createdInviteLink ? (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>¡Enlace generado exitosamente!</span>
                  </div>
                  <p className="text-[11px] text-emerald-900 leading-relaxed">
                    Comparte este enlace con el florista invitado. Al ingresar, el token validará su comercio automáticamente:
                  </p>
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-300 font-mono text-[11px] break-all select-all text-[#2C2825]">
                    {createdInviteLink}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdInviteLink);
                      showNotification('Enlace copiado al portapapeles');
                    }}
                    className="px-4 py-2 bg-[#B25E5C] text-white text-xs font-semibold rounded-xl hover:bg-[#9E4D48] cursor-pointer"
                  >
                    Copiar Enlace
                  </button>
                  <button
                    onClick={() => setShowNewInviteModal(false)}
                    className="px-4 py-2 bg-white border border-[#EAE3D9] text-xs font-medium rounded-xl hover:bg-[#FAF8F5] cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateInvitation} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#2C2825] mb-1">
                    Nombre comercial de la florería *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Florería El Rosal Dorado"
                    value={inviteBusinessName}
                    onChange={(e) => setInviteBusinessName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl focus:ring-[#B25E5C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#2C2825] mb-1">
                    Correo del florista invitado *
                  </label>
                  <input
                    type="email"
                    placeholder="contacto@rosaldorado.mx"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl focus:ring-[#B25E5C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#2C2825] mb-1">
                    Vigencia de la invitación
                  </label>
                  <select
                    value={inviteDays}
                    onChange={(e) => setInviteDays(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl"
                  >
                    <option value={3}>3 días</option>
                    <option value={7}>7 días (Recomendado)</option>
                    <option value={15}>15 días</option>
                    <option value={30}>30 días</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-[#EAE3D9] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewInviteModal(false)}
                    className="px-4 py-2 bg-white border border-[#EAE3D9] text-xs font-medium rounded-xl hover:bg-[#FAF8F5] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#B25E5C] hover:bg-[#9E4D48] text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Generar Token
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
