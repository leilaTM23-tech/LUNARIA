import { createClient } from '@supabase/supabase-js';

let rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!rawUrl || !supabaseAnonKey) {
    console.warn('⚠️ Faltan las variables de entorno de Supabase en el archivo .env');
} else if (!rawUrl.includes('.supabase.co') && !rawUrl.includes('localhost') && !rawUrl.includes('127.0.0.1')) {
    rawUrl = `${rawUrl.replace(/\/+$/, '')}.supabase.co`;
}

export const supabase = createClient(rawUrl || '', supabaseAnonKey || '');
