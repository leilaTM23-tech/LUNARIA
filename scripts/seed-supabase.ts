/**
 * Carga los datos de ejemplo (src/data/seedData.ts) en Supabase.
 * ⚠️ Borra primero el contenido de todas las tablas de Lunaria.
 *
 * Requisitos: haber ejecutado supabase/schema.sql y tener .env.local configurado.
 * Uso: npm run seed:supabase
 */
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { seedDatabase } from '../src/services/supabaseSeed';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const url = (process.env.VITE_SUPABASE_URL || '').trim();
const key = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!url || !key) {
  console.error('❌ Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local');
  process.exit(1);
}

console.log(`🌱 Cargando datos de ejemplo en ${url} ...\n`);

seedDatabase(createClient(url, key), console.log)
  .then(() => console.log('\n✅ Base de datos lista.'))
  .catch((err) => {
    console.error(`\n❌ ${err.message}`);
    console.error('   ¿Ya ejecutaste supabase/schema.sql en el SQL Editor de Supabase?');
    process.exit(1);
  });
