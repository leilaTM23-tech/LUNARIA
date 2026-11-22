import React from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAuth, homeForRole } from '../../context/AuthContext';
import { UserRole } from '../../types';

/**
 * Ruta protegida. Úsala como ruta "contenedora" en App.tsx:
 *
 *   <Route element={<RequireAuth roles={['admin']} />}>
 *     <Route path="/admin" element={<AdminDashboardPage />} />
 *   </Route>
 *
 * - Sin sesión → redirige a /login y, al iniciar sesión, regresa a la página pedida.
 * - Con sesión pero rol no permitido → mensaje de acceso denegado.
 */
export const RequireAuth: React.FC<{ roles?: UserRole[] }> = ({ roles }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="w-6 h-6 text-[#B25E5C] animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (roles && !roles.includes(currentUser.role)) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-3">
        <ShieldAlert className="w-10 h-10 mx-auto text-[#B25E5C]" />
        <h1 className="font-serif text-2xl font-semibold text-[#2C2825]">No tienes acceso a esta sección</h1>
        <p className="text-xs text-[#7A736E]">
          Tu cuenta ({currentUser.email}) no tiene permisos para ver esta página.
        </p>
        <Link
          to={homeForRole(currentUser.role)}
          className="inline-block px-4 py-2 bg-[#2C2825] text-white rounded-lg text-xs font-semibold"
        >
          Ir a mi inicio
        </Link>
      </div>
    );
  }

  return <Outlet />;
};
