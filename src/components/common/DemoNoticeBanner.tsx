import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { AlertCircle, RotateCcw, UserCheck, ChevronDown } from 'lucide-react';

export const DemoNoticeBanner: React.FC = () => {
  const { currentUser, allDemoProfiles, switchDemoUser } = useAuth();
  const { resetAllDemoData } = useMarketplace();
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (window.confirm('¿Deseas restablecer todos los pedidos, productos y perfiles al estado inicial de demostración?')) {
      setResetting(true);
      await resetAllDemoData();
      setResetting(false);
    }
  };

  const roleLabel =
    currentUser.role === 'admin'
      ? 'Administradora'
      : currentUser.role === 'florist'
      ? 'Vendedora (Florería)'
      : 'Compradora';

  return (
    <>
      <div className="bg-[#F4ECE9] border-b border-[#E3D1CC] text-[#59342B] text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#A84B43] shrink-0" />
          <span>
            <strong className="font-semibold text-[#8C3D38]">MODO DEMO TLAXCALA:</strong> Datos simulados con persistencia local. Listo para integración con Supabase.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSwitchModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/80 hover:bg-white text-[#59342B] rounded border border-[#DAC4BD] transition-colors cursor-pointer"
            title="Cambiar entre perfiles de prueba"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#A84B43]" />
            <span className="font-medium">{currentUser.fullName}</span>
            <span className="text-[#8C6D65]">({roleLabel})</span>
            <ChevronDown className="w-3 h-3 text-[#8C6D65]" />
          </button>

          <button
            onClick={handleReset}
            disabled={resetting}
            className="inline-flex items-center gap-1 text-[#8C3D38] hover:text-[#59342B] underline text-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{resetting ? 'Restableciendo...' : 'Restablecer demo'}</span>
          </button>
        </div>
      </div>

      {/* Modal rápido de selección de roles de demostración */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-[#EAE3D9] p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D9]">
              <div>
                <h3 className="font-serif text-xl font-semibold text-[#2C2825]">
                  Selector de Perfiles de Prueba
                </h3>
                <p className="text-xs text-[#7A736E] mt-0.5">
                  Cambia de rol en un clic para probar el flujo de compra, ventas y administración.
                </p>
              </div>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Administradores */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9E4D48] mb-2">
                  Panel de Administración (1 usuario)
                </p>
                <div className="space-y-1.5">
                  {allDemoProfiles
                    .filter((p) => p.role === 'admin')
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          switchDemoUser(p.id);
                          setShowSwitchModal(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-lg border text-sm transition-all flex items-center justify-between cursor-pointer ${
                          currentUser.id === p.id
                            ? 'bg-[#FBF4F2] border-[#C86D67] text-[#8C3D38] font-medium'
                            : 'border-[#EAE3D9] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-[#2C2825]">{p.fullName}</div>
                          <div className="text-xs text-[#7A736E]">{p.email} · Supervisión general y catálogo</div>
                        </div>
                        {currentUser.id === p.id && (
                          <span className="text-xs bg-[#C86D67] text-white px-2 py-0.5 rounded">Activo</span>
                        )}
                      </button>
                    ))}
                </div>
              </div>

              {/* Vendedores / Florerías con Escenarios A, B, C */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#5A735E]">
                    Vendedores y Escenarios de Registro (7 floristas)
                  </p>
                  <span className="text-[10px] text-[#8A8179]">Escenarios A, B y C</span>
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {allDemoProfiles
                    .filter((p) => p.role === 'florist')
                    .map((p) => {
                      let scenarioBadge = '';
                      let badgeColor = '';
                      let shopDesc = '';

                      if (p.id === 'user-florist-patricia') {
                        scenarioBadge = 'Escenario A: Invitación (Pendiente)';
                        badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
                        shopDesc = 'Florería La Magnolia (Tlaxco) · Registro por token inv-tlaxco-991';
                      } else if (p.id === 'user-florist-gabriel') {
                        scenarioBadge = 'Escenario B: Solicitud Pública (Info Requerida)';
                        badgeColor = 'bg-purple-100 text-purple-800 border-purple-300';
                        shopDesc = 'Orquídeas y Lirios (San Pablo del Monte) · Espera aclaraciones';
                      } else if (p.id === 'user-florist-roberto') {
                        scenarioBadge = 'Escenario C1: Rechazada (Con motivo)';
                        badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
                        shopDesc = 'Flores Finas (Chiautempan) · Bloqueada por fuera de cobertura';
                      } else if (p.id === 'user-florist-lucia') {
                        scenarioBadge = 'Escenario C2: Suspendida (Con motivo)';
                        badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
                        shopDesc = 'Boutique Silvestre (Huamantla) · Operaciones pausadas por atrasos';
                      } else if (p.id === 'user-florist-carlos') {
                        scenarioBadge = 'Aprobada Activa';
                        badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                        shopDesc = 'Florería Bugambilia (Tlaxcala Centro) · Catálogo completo';
                      } else if (p.id === 'user-florist-sofia') {
                        scenarioBadge = 'Aprobada Activa';
                        badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                        shopDesc = 'Rosas del Valle (Apizaco Centro) · Envíos activos';
                      } else if (p.id === 'user-florist-mateo') {
                        scenarioBadge = 'Aprobada Activa';
                        badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                        shopDesc = 'Jardín Imperial (Huamantla Centro)';
                      } else {
                        scenarioBadge = 'Florería Nueva';
                        badgeColor = 'bg-stone-100 text-stone-800 border-stone-300';
                        shopDesc = p.email;
                      }

                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            switchDemoUser(p.id);
                            setShowSwitchModal(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-start justify-between cursor-pointer ${
                            currentUser.id === p.id
                              ? 'bg-[#F2F6F3] border-[#5A735E] text-[#3E5241] font-medium'
                              : 'border-[#EAE3D9] hover:bg-[#FAF8F5]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#2C2825]">{p.fullName}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${badgeColor}`}>
                                {scenarioBadge}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#7A736E] mt-0.5">{shopDesc}</div>
                          </div>
                          {currentUser.id === p.id && (
                            <span className="text-[10px] bg-[#5A735E] text-white px-2 py-0.5 rounded font-medium shrink-0 ml-2">
                              Activo
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Compradores */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8A7869] mb-2">
                  Compradores de Demostración (6 clientes en Tlaxcala)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {allDemoProfiles
                    .filter((p) => p.role === 'buyer')
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          switchDemoUser(p.id);
                          setShowSwitchModal(false);
                        }}
                        className={`p-2.5 rounded-lg border text-xs text-left transition-all flex items-center justify-between cursor-pointer ${
                          currentUser.id === p.id
                            ? 'bg-[#FAF6F0] border-[#B89F82] font-semibold text-[#5A4533]'
                            : 'border-[#EAE3D9] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-[#2C2825]">{p.fullName}</div>
                          <div className="text-[#8A8179] truncate">{p.email}</div>
                        </div>
                        {currentUser.id === p.id && (
                          <span className="text-[10px] bg-[#8A7869] text-white px-1.5 py-0.5 rounded shrink-0 ml-1">
                            Activo
                          </span>
                        )}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#EAE3D9] flex justify-end">
              <button
                onClick={() => setShowSwitchModal(false)}
                className="px-4 py-2 bg-[#2C2825] text-white text-xs font-medium rounded-lg hover:bg-black transition-colors cursor-pointer"
              >
                Cerrar selector
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
