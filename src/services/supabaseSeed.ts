import type { SupabaseClient } from '@supabase/supabase-js';
import { TableName, toRow } from './supabaseMapping';
import {
  INITIAL_COMMUNITIES,
  INITIAL_CATEGORIES,
  INITIAL_FLORISTS,
  INITIAL_CATALOG_PRODUCTS,
  INITIAL_PRODUCT_OFFERS,
  INITIAL_PROFILES,
  INITIAL_ORDERS,
  INITIAL_INVITATIONS,
  INITIAL_APPLICATIONS,
  INITIAL_AUDIT_LOGS,
} from '../data/seedData';

/** Orden de inserción respetando llaves foráneas (padres primero). */
const SEED_PLAN: [TableName, Record<string, any>[]][] = [
  ['communities', INITIAL_COMMUNITIES],
  ['categories', INITIAL_CATEGORIES],
  ['profiles', INITIAL_PROFILES],
  ['florists', INITIAL_FLORISTS],
  ['catalog_products', INITIAL_CATALOG_PRODUCTS],
  ['product_offers', INITIAL_PRODUCT_OFFERS],
  ['orders', INITIAL_ORDERS],
  ['florist_invitations', INITIAL_INVITATIONS],
  ['florist_applications', INITIAL_APPLICATIONS],
  ['application_audit_logs', INITIAL_AUDIT_LOGS],
];

/**
 * Borra todas las tablas de Lunaria y vuelve a cargar los datos de ejemplo
 * de src/data/seedData.ts. Usado por `npm run seed:supabase` y por el botón
 * "Restablecer demo" de la app.
 */
export async function seedDatabase(
  client: SupabaseClient,
  log: (msg: string) => void = () => {}
): Promise<void> {
  // 1. Borrar en orden inverso (hijos primero)
  for (const [table] of [...SEED_PLAN].reverse()) {
    // PostgREST exige un filtro en DELETE: "id distinto de vacío" = todas las filas
    const { error } = await client.from(table).delete().neq('id', '');
    if (error) throw new Error(`No se pudo vaciar "${table}": ${error.message}`);
  }

  // 2. Insertar en orden (padres primero)
  for (const [table, rows] of SEED_PLAN) {
    // defaultToNull: false → si un registro no trae un campo, se aplica el DEFAULT de la columna
    const { error } = await client
      .from(table)
      .insert(rows.map((r) => toRow(table, r)), { defaultToNull: false });
    if (error) throw new Error(`No se pudo poblar "${table}": ${error.message}`);
    log(`✔ ${table}: ${rows.length} registros`);
  }
}
