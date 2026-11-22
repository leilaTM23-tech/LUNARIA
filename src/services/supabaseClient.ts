import { createClient } from '@supabase/supabase-js';

// En el navegador las variables llegan por Vite (import.meta.env);
// en scripts de Node (tsx) llegan por process.env (dotenv).
const env: Record<string, string | undefined> =
    (import.meta as any).env ?? (typeof process !== 'undefined' ? process.env : {});

let rawUrl = (env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!rawUrl || !supabaseAnonKey) {
    console.warn('⚠️ Faltan las variables de entorno de Supabase en el archivo .env');
} else if (!rawUrl.includes('.supabase.co') && !rawUrl.includes('localhost') && !rawUrl.includes('127.0.0.1')) {
    rawUrl = `${rawUrl.replace(/\/+$/, '')}.supabase.co`;
}

export const supabase = createClient(rawUrl || '', supabaseAnonKey || '');
