import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local first, then .env
if (fs.existsSync(path.resolve(process.cwd(), '.env.local'))) {
    dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}
if (fs.existsSync(path.resolve(process.cwd(), '.env'))) {
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

interface TestResult {
    name: string;
    passed: boolean;
    details: string;
    suggestion?: string;
}

const results: TestResult[] = [];

function logSection(title: string) {
    console.log('\n' + '='.repeat(60));
    console.log(`  ${title}`);
    console.log('='.repeat(60));
}

function logResult(r: TestResult) {
    const icon = r.passed ? '✅ [PASS]' : '❌ [FAIL]';
    console.log(`${icon} ${r.name}`);
    console.log(`   Detalle: ${r.details}`);
    if (r.suggestion) {
        console.log(`   💡 Sugerencia: ${r.suggestion}`);
    }
}

async function runTests() {
    console.log('🚀 Iniciando Entorno de Pruebas de Conexión a Supabase...');

    // 1. Verificación de variables de entorno
    logSection('1. Variables de Entorno');

    const envUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const envKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!envUrl) {
        results.push({
            name: 'Variable VITE_SUPABASE_URL',
            passed: false,
            details: 'No encontrada en .env ni .env.local',
            suggestion: 'Define VITE_SUPABASE_URL en tu archivo .env o .env.local'
        });
    } else {
        results.push({
            name: 'Variable VITE_SUPABASE_URL',
            passed: true,
            details: `Presente: ${envUrl}`
        });
    }

    if (!envKey) {
        results.push({
            name: 'Variable VITE_SUPABASE_ANON_KEY',
            passed: false,
            details: 'No encontrada en .env ni .env.local',
            suggestion: 'Define VITE_SUPABASE_ANON_KEY en tu archivo .env o .env.local'
        });
    } else {
        const maskedKey = envKey.substring(0, 10) + '...' + envKey.substring(envKey.length - 4);
        results.push({
            name: 'Variable VITE_SUPABASE_ANON_KEY',
            passed: true,
            details: `Presente (${maskedKey})`
        });
    }

    results.forEach(logResult);
    if (!envUrl || !envKey) {
        console.log('\n❌ No se puede continuar sin las variables requeridas.');
        return;
    }

    // 2. Validación de Formato de URL
    logSection('2. Formato de URL de Supabase');
    let normalizedUrl = envUrl.trim();
    let urlValid = false;

    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        logResult({
            name: 'Protocolo URL',
            passed: false,
            details: `La URL '${normalizedUrl}' no tiene protocolo https://`,
            suggestion: 'Asegúrate de que comience con https://'
        });
    } else if (!normalizedUrl.includes('.supabase.co') && !normalizedUrl.includes('localhost') && !normalizedUrl.includes('127.0.0.1')) {
        logResult({
            name: 'Dominio de Supabase',
            passed: false,
            details: `La URL '${normalizedUrl}' no contiene '.supabase.co'`,
            suggestion: `El dominio de Supabase suele ser: '${normalizedUrl}.supabase.co'`
        });
    } else {
        urlValid = true;
        logResult({
            name: 'Formato de URL',
            passed: true,
            details: `Formato de URL válido: ${normalizedUrl}`
        });
    }

    const testUrl = urlValid ? normalizedUrl : (
        !normalizedUrl.includes('.supabase.co') && normalizedUrl.startsWith('https://') 
            ? `${normalizedUrl}.supabase.co` 
            : normalizedUrl
    );

    // 3. Prueba de conectividad HTTP / DNS
    logSection('3. Conectividad de Red y Servidor');
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`${testUrl}/auth/v1/health`, {
            signal: controller.signal,
            headers: { 'apikey': envKey }
        }).catch(async () => {
            // fallback al endpoint raíz
            return await fetch(testUrl, { signal: controller.signal });
        });
        clearTimeout(timeout);

        if (res) {
            logResult({
                name: 'Ping de Conectividad HTTP',
                passed: true,
                details: `Respuesta recibida del servidor (Status: ${res.status} ${res.statusText})`
            });
        }
    } catch (err: any) {
        logResult({
            name: 'Ping de Conectividad HTTP',
            passed: false,
            details: `Fallo al conectar: ${err.message}`,
            suggestion: `Verifica si la URL está completa. Si usaste '${envUrl}', tal vez sea '${envUrl}.supabase.co'`
        });
    }

    // 4. Inicialización y Autenticación del Cliente Supabase
    logSection('4. Autenticación y Servicio Auth de Supabase');
    const supabase = createClient(testUrl, envKey);

    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            logResult({
                name: 'Servicio Auth (getSession)',
                passed: false,
                details: `Error en servicio de autenticación: ${error.message}`,
                suggestion: 'Verifica que la clave anon/publishable sea válida en tu panel de Supabase'
            });
        } else {
            logResult({
                name: 'Servicio Auth (getSession)',
                passed: true,
                details: 'Servicio de autenticación responde correctamente'
            });
        }
    } catch (err: any) {
        logResult({
            name: 'Servicio Auth (getSession)',
            passed: false,
            details: `Excepción: ${err.message}`
        });
    }

    // 5. Verificación de Tablas del Repositorio
    logSection('5. Tablas de Base de Datos (SupabaseRepository)');
    const tablesToTest = [
        'communities',
        'categories',
        'profiles',
        'florists',
        'catalog_products',
        'product_offers',
        'orders',
        'florist_invitations',
        'florist_applications',
        'application_audit_logs'
    ];

    for (const table of tablesToTest) {
        try {
            const { data, error, status } = await supabase
                .from(table)
                .select('*')
                .limit(1);

            if (error) {
                // Errores comunes:
                // PGRST204 / 404: Tabla no encontrada (falta migración)
                // 401 / 403: RLS bloquea o clave inválida
                const isRls = error.message.toLowerCase().includes('policy') || error.code === '42501';
                const notFound = error.code === 'PGRST204' || error.message.toLowerCase().includes('relation') || error.message.toLowerCase().includes('does not exist');

                logResult({
                    name: `Tabla '${table}'`,
                    passed: false,
                    details: `Status ${status}: [${error.code || 'ERROR'}] ${error.message}`,
                    suggestion: notFound 
                        ? `La tabla '${table}' no existe aún en la base de datos de Supabase. Ejecuta supabase/schema.sql en el SQL Editor de Supabase.`
                        : isRls 
                        ? `La tabla existe pero las políticas RLS restringen la lectura anónima.` 
                        : undefined
                });
            } else {
                logResult({
                    name: `Tabla '${table}'`,
                    passed: true,
                    details: `Conexión y lectura exitosa. Registros retornados en test: ${data?.length ?? 0}`
                });
            }
        } catch (err: any) {
            logResult({
                name: `Tabla '${table}'`,
                passed: false,
                details: `Excepción inesperada: ${err.message}`
            });
        }
    }

    // Resumen
    logSection('Resumen');
    console.log(`Pruebas ejecutadas con URL evaluada: ${testUrl}`);
    console.log('Para ejecutar nuevamente: npm run test:supabase\n');
}

runTests().catch(console.error);
