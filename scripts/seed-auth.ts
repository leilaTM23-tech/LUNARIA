/**
 * Crea en Supabase Auth las cuentas de demostración (los 15 perfiles de seedData),
 * todas con la contraseña DEMO_PASSWORD (src/data/demoAccounts.ts).
 *
 * Requisito: en Supabase → Authentication → Sign In / Providers → Email,
 * desactiva "Confirm email". Así no se envía ningún correo a estas direcciones
 * ficticias y las cuentas quedan listas para iniciar sesión.
 *
 * Se ejecuta UNA sola vez por proyecto (las cuentas sobreviven a `npm run seed:supabase`;
 * el perfil se vuelve a vincular solo en el siguiente inicio de sesión).
 * Uso: npm run seed:auth
 */
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../src/data/demoAccounts';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true });

const url = (process.env.VITE_SUPABASE_URL || '').trim();
const key = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
if (!url || !key) {
  console.error('❌ Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local');
  process.exit(1);
}

const auth = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }).auth;

async function main() {
  console.log(`🔐 Creando ${DEMO_ACCOUNTS.length} cuentas de demostración en Supabase Auth...\n`);
  let created = 0;
  let existing = 0;

  for (const account of DEMO_ACCOUNTS) {
    const { data, error } = await auth.signUp({
      email: account.email,
      password: DEMO_PASSWORD,
      options: { data: { full_name: account.fullName } },
    });

    if (error) {
      if (/already registered|already been registered/i.test(error.message)) {
        existing++;
        console.log(`  • ${account.email} (ya existía)`);
        continue;
      }
      throw new Error(`${account.email}: ${error.message}`);
    }

    if (!data.session) {
      // Con "Confirm email" activo Supabase no devuelve sesión e intenta mandar un correo.
      // Nos detenemos en la primera cuenta para no seguir enviando correos.
      throw new Error(
        'Tu proyecto exige confirmar el correo. Desactiva "Confirm email" en ' +
          'Supabase → Authentication → Sign In / Providers → Email y vuelve a ejecutar este script.'
      );
    }

    // Supabase "oculta" las cuentas repetidas devolviendo un usuario sin identidades
    if (data.user && data.user.identities?.length === 0) {
      existing++;
      console.log(`  • ${account.email} (ya existía)`);
    } else {
      created++;
      console.log(`  ✔ ${account.email} (${account.role})`);
    }
    await auth.signOut();
  }

  console.log(`\n✅ Listo: ${created} creadas, ${existing} ya existían. Contraseña: ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
});
