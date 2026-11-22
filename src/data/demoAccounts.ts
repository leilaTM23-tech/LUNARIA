import { INITIAL_PROFILES } from './seedData';
import { UserRole } from '../types';

/**
 * Contraseña común de las cuentas de demostración (perfiles de seedData).
 * Las cuentas se crean en Supabase Auth con `npm run seed:auth`.
 * Solo para la demo escolar: en un sistema real cada usuario define la suya.
 */
export const DEMO_PASSWORD = 'Lunaria2026!';

export interface DemoAccount {
  email: string;
  fullName: string;
  role: UserRole;
}

export const DEMO_ACCOUNTS: DemoAccount[] = INITIAL_PROFILES.map((p) => ({
  email: p.email,
  fullName: p.fullName,
  role: p.role,
}));
