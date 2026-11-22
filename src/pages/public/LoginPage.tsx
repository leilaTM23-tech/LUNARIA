import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth, homeForRole } from '../../context/AuthContext';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, DemoAccount } from '../../data/demoAccounts';
import { Shield, Store, User, Sparkles, ChevronDown, LogIn } from 'lucide-react';

const ROLE_LABEL = { admin: 'Administración', florist: 'Florerías', buyer: 'Compradores' } as const;
const ROLE_ICON = { admin: Shield, florist: Store, buyer: User } as const;

export const LoginPage: React.FC = () => {
  const { login, currentUser, loading: restoring } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Página a la que el usuario intentaba entrar antes de que se le pidiera iniciar sesión
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  // Si ya hay sesión, no tiene sentido mostrar el login
  useEffect(() => {
    if (!restoring && currentUser) navigate(from || homeForRole(currentUser.role), { replace: true });
  }, [restoring, currentUser, from, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y tu contraseña.');
      return;
    }
    setSubmitting(true);
    try {
      const profile = await login(email, password);
      navigate(from || homeForRole(profile.role), { replace: true });
    } catch (err: any) {
      setError(err.message || 'No se pudo iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(DEMO_PASSWORD);
    setError('');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs text-[#B25E5C] bg-[#FAF0ED] px-3 py-1 rounded-full font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Bienvenido de vuelta</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2C2825]">Iniciar sesión</h1>
        <p className="text-xs text-[#7A736E]">
          {from ? 'Inicia sesión para continuar con tu compra.' : 'Accede a tu cuenta de Lunaria.'}
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] shadow-sm space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="login-email" className="block text-xs font-medium text-[#2C2825] mb-1">
              Correo electrónico
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#B25E5C]"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-medium text-[#2C2825] mb-1">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#B25E5C]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#2C2825] hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {submitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="text-center text-xs text-[#7A736E]">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" state={{ from }} className="text-[#B25E5C] font-semibold hover:underline">
            Crear cuenta
          </Link>
        </div>
      </div>

      {/* Cuentas de demostración (proyecto escolar) */}
      <div className="bg-[#FAF8F5] rounded-2xl border border-dashed border-[#D1C6BA] text-xs">
        <button
          type="button"
          onClick={() => setShowDemo(!showDemo)}
          className="w-full px-4 py-3 flex items-center justify-between font-semibold text-[#665E58] cursor-pointer"
        >
          <span>Cuentas de demostración</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showDemo ? 'rotate-180' : ''}`} />
        </button>
        {showDemo && (
          <div className="px-4 pb-4 space-y-3">
            <p className="text-[11px] text-[#8A8179]">
              Todas usan la contraseña <code className="font-mono text-[#2C2825]">{DEMO_PASSWORD}</code>. Haz clic
              en una para llenar el formulario.
            </p>
            {(['admin', 'florist', 'buyer'] as const).map((role) => {
              const Icon = ROLE_ICON[role];
              return (
                <div key={role}>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#B25E5C] mb-1">
                    <Icon className="w-3 h-3" />
                    {ROLE_LABEL[role]}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {DEMO_ACCOUNTS.filter((a) => a.role === role).map((a) => (
                      <button
                        key={a.email}
                        type="button"
                        onClick={() => fillDemo(a)}
                        className="text-left px-2.5 py-1.5 rounded-lg bg-white border border-[#EAE3D9] hover:border-[#B25E5C] cursor-pointer"
                      >
                        <div className="font-medium text-[#2C2825] truncate">{a.fullName}</div>
                        <div className="text-[10px] text-[#8A8179] truncate">{a.email}</div>
                      </button>
                    ))}
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
