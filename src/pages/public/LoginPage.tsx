import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Store, User, ArrowRight, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { allDemoProfiles, switchDemoUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const found = allDemoProfiles.find((p) => p.email.toLowerCase() === email.toLowerCase().trim());
    if (found) {
      switchDemoUser(found.id);
      if (found.role === 'admin') navigate('/admin');
      else if (found.role === 'florist') navigate('/vendedor');
      else navigate('/comprador/perfil');
    } else {
      setError('Para esta demostración interactiva, selecciona uno de los perfiles de prueba listados abajo o ingresa un correo de prueba.');
    }
  };

  const handleSelectDemo = (profileId: string, role: string) => {
    switchDemoUser(profileId);
    if (role === 'admin') navigate('/admin');
    else if (role === 'florist') navigate('/vendedor');
    else navigate('/catalogo');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs text-[#B25E5C] bg-[#FAF0ED] px-3 py-1 rounded-full font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Acceso al sistema Lunaria</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#2C2825]">
          Iniciar Sesión
        </h1>
        <p className="text-xs text-[#7A736E]">
          Accede como comprador, florista local o supervisora de la plataforma.
        </p>
      </div>

      {/* Selector Rápido de Demostración */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] shadow-sm space-y-6">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#B25E5C] mb-2">
            Ingreso rápido con cuentas de prueba
          </h2>
          <p className="text-xs text-[#665E58] leading-relaxed">
            Haz clic en cualquiera de las siguientes identidades simuladas para explorar la plataforma con sus permisos correspondientes:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Admin */}
          <button
            onClick={() => handleSelectDemo('user-admin-elena', 'admin')}
            className="p-4 rounded-2xl border border-[#EAE3D9] hover:border-[#8C3D38] hover:bg-[#FBF4F2] transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-[#FAF0ED] text-[#8C3D38] flex items-center justify-center mb-2">
                <Shield className="w-4 h-4" />
              </div>
              <div className="font-semibold text-xs text-[#2C2825]">Lic. Elena Morales</div>
              <div className="text-[11px] text-[#8A8179] mt-0.5">Administradora General</div>
            </div>
            <div className="mt-3 text-[11px] font-semibold text-[#8C3D38] flex items-center gap-1">
              <span>Entrar como Admin</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          {/* Vendedor Bugambilia */}
          <button
            onClick={() => handleSelectDemo('user-florist-carlos', 'florist')}
            className="p-4 rounded-2xl border border-[#EAE3D9] hover:border-[#5A735E] hover:bg-[#F2F6F3] transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-[#EEF3EE] text-[#5A735E] flex items-center justify-center mb-2">
                <Store className="w-4 h-4" />
              </div>
              <div className="font-semibold text-xs text-[#2C2825]">Carlos Rivera</div>
              <div className="text-[11px] text-[#8A8179] mt-0.5">Florería Bugambilia (Tlaxcala)</div>
            </div>
            <div className="mt-3 text-[11px] font-semibold text-[#5A735E] flex items-center gap-1">
              <span>Entrar como Florista</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          {/* Compradora */}
          <button
            onClick={() => handleSelectDemo('user-buyer-mariana', 'buyer')}
            className="p-4 rounded-2xl border border-[#EAE3D9] hover:border-[#B25E5C] hover:bg-[#FAF0ED] transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-[#FAF0ED] text-[#B25E5C] flex items-center justify-center mb-2">
                <User className="w-4 h-4" />
              </div>
              <div className="font-semibold text-xs text-[#2C2825]">Mariana Herrera</div>
              <div className="text-[11px] text-[#8A8179] mt-0.5">Compradora de Tlaxcala Centro</div>
            </div>
            <div className="mt-3 text-[11px] font-semibold text-[#B25E5C] flex items-center gap-1">
              <span>Entrar como Cliente</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        </div>

        {/* Formulario simulado para probar validaciones */}
        <div className="pt-6 border-t border-[#F2ECE4]">
          <h3 className="text-xs font-semibold text-[#2C2825] mb-3">
            O escribe tu correo registrado:
          </h3>

          <form onSubmit={handleManualLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#2C2825] mb-1">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ej. mariana.herrera@gmail.com"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#B25E5C]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2C2825] mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs text-[#2C2825] focus:outline-none focus:border-[#B25E5C]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#2C2825] hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Ingresar a la plataforma
            </button>
          </form>
        </div>

        <div className="text-center text-xs text-[#7A736E]">
          ¿No tienes una cuenta aún?{' '}
          <Link to="/registro" className="text-[#B25E5C] font-semibold hover:underline">
            Registrarte aquí
          </Link>
        </div>
      </div>
    </div>
  );
};
