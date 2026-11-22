import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { Address, Profile, UserRole } from '../types';
import { repository } from '../services/repository';
import { supabase } from '../services/supabaseClient';

/**
 * Sesión de usuario con Supabase Auth (correo + contraseña).
 *
 * - Sin sesión, el visitante navega como invitado (currentUser = null).
 * - La sesión se guarda en el navegador y se restaura al recargar.
 * - Cada cuenta de auth.users se vincula a un perfil de public.profiles
 *   (columna auth_user_id). Los perfiles de ejemplo se vinculan por correo
 *   la primera vez que alguien inicia sesión con ellos.
 */

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: UserRole;
  floristId?: string;
  addresses?: Address[];
}

interface AuthContextType {
  currentUser: Profile | null;
  /** true mientras se restaura la sesión guardada al abrir el sitio */
  loading: boolean;
  login: (email: string, password: string) => Promise<Profile>;
  register: (input: RegisterInput) => Promise<Profile>;
  logout: () => Promise<void>;
  updateCurrentProfile: (updates: Partial<Profile>) => Promise<Profile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Traduce los mensajes de Supabase Auth al español. */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (m.includes('email not confirmed'))
    return 'Tu correo aún no está confirmado. Revisa tu bandeja de entrada.';
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Ya existe una cuenta con ese correo. Inicia sesión.';
  if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (m.includes('is invalid') && m.includes('email')) return 'El correo electrónico no es válido.';
  if (m.includes('rate limit')) return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
  return message;
}

/** Busca el perfil de una cuenta de Supabase Auth (por id vinculado o, si no, por correo). */
async function findProfileFor(user: User): Promise<Profile | null> {
  const profiles = await repository.getProfiles();
  const email = (user.email ?? '').toLowerCase();
  const profile =
    profiles.find((p) => p.authUserId === user.id) ??
    profiles.find((p) => p.email.toLowerCase() === email) ??
    null;

  // Vincular el perfil con la cuenta la primera vez
  if (profile && profile.authUserId !== user.id) {
    return repository.saveProfile({ ...profile, authUserId: user.id });
  }
  return profile;
}

/** Crea un perfil de comprador para una cuenta que no tiene perfil todavía. */
function newProfileFor(user: User, input?: Partial<RegisterInput>): Profile {
  const now = new Date().toISOString();
  return {
    id: user.id,
    authUserId: user.id,
    email: user.email ?? input?.email ?? '',
    fullName: input?.fullName || (user.user_metadata?.full_name as string) || user.email || 'Usuario',
    phone: input?.phone || (user.user_metadata?.phone as string) || '',
    role: input?.role ?? 'buyer',
    floristId: input?.floristId,
    addresses: input?.addresses ?? [],
    createdAt: now,
    updatedAt: now,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Restaurar la sesión guardada (si la hay)
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        const user = data.session?.user;
        if (!user) return;
        const profile = (await findProfileFor(user)) ?? (await repository.saveProfile(newProfileFor(user)));
        setCurrentUser(profile);
      })
      .catch((err) => console.error('[Auth] No se pudo restaurar la sesión:', err))
      .finally(() => setLoading(false));

    // 2. Si la sesión se cierra (en esta u otra pestaña, o expira), volver a invitado.
    //    Login y registro asignan el perfil ellos mismos.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setCurrentUser(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<Profile> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw new Error(friendlyAuthError(error.message));

    const profile =
      (await findProfileFor(data.user)) ?? (await repository.saveProfile(newProfileFor(data.user)));
    setCurrentUser(profile);
    return profile;
  };

  const register = async (input: RegisterInput): Promise<Profile> => {
    const email = input.email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: { data: { full_name: input.fullName, phone: input.phone } },
    });
    if (error) throw new Error(friendlyAuthError(error.message));
    if (!data.user || !data.session) {
      // El proyecto de Supabase exige confirmar el correo antes de iniciar sesión
      throw new Error(
        'Cuenta creada. Revisa tu correo para confirmarla y después inicia sesión. ' +
          '(Para la demo, desactiva "Confirm email" en Supabase → Authentication.)'
      );
    }

    // Si ya había un perfil con ese correo (ej. datos de ejemplo) se vincula; si no, se crea.
    const existing = await findProfileFor(data.user);
    const profile = existing ?? (await repository.saveProfile(newProfileFor(data.user, { ...input, email })));
    setCurrentUser(profile);
    return profile;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const updateCurrentProfile = async (updates: Partial<Profile>): Promise<Profile> => {
    if (!currentUser) throw new Error('No hay una sesión iniciada.');
    const saved = await repository.saveProfile({
      ...currentUser,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    setCurrentUser(saved);
    return saved;
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, register, logout, updateCurrentProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};

/**
 * Usuario con sesión garantizada. Úsalo solo en páginas protegidas por <RequireAuth>,
 * que se encarga de redirigir al login si no hay sesión.
 */
export const useRequiredUser = (): Profile => {
  const { currentUser } = useAuth();
  if (!currentUser) throw new Error('useRequiredUser se usó fuera de una ruta protegida por <RequireAuth>.');
  return currentUser;
};

/** Página de inicio según el rol del usuario. */
export const homeForRole = (role: UserRole): string =>
  role === 'admin' ? '/admin' : role === 'florist' ? '/vendedor' : '/';
