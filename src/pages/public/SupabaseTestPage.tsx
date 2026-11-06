import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Database, ShieldCheck, Globe, Key, ArrowRight } from 'lucide-react';

interface CheckItem {
    id: string;
    title: string;
    status: 'idle' | 'running' | 'success' | 'error' | 'warning';
    message: string;
    suggestion?: string;
    durationMs?: number;
}

export function SupabaseTestPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [checks, setChecks] = useState<CheckItem[]>([
        { id: 'env', title: '1. Variables de Entorno en Cliente (Vite)', status: 'idle', message: 'Pendiente de inicio' },
        { id: 'url', title: '2. Formato de Dominio Supabase', status: 'idle', message: 'Pendiente de inicio' },
        { id: 'ping', title: '3. Ping de Red & Servicio Auth', status: 'idle', message: 'Pendiente de inicio' },
        { id: 'table_profiles', title: '4. Tabla: profiles', status: 'idle', message: 'Pendiente de inicio' },
        { id: 'table_florists', title: '5. Tabla: florists', status: 'idle', message: 'Pendiente de inicio' },
        { id: 'table_invitations', title: '6. Tabla: florist_invitations', status: 'idle', message: 'Pendiente de inicio' },
        { id: 'table_applications', title: '7. Tabla: florist_applications', status: 'idle', message: 'Pendiente de inicio' },
        { id: 'table_audit', title: '8. Tabla: application_audit_logs', status: 'idle', message: 'Pendiente de inicio' },
    ]);

    const runDiagnostics = async () => {
        setIsRunning(true);

        const updateCheck = (id: string, patch: Partial<CheckItem>) => {
            setChecks(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
        };

        // Reset
        setChecks(prev => prev.map(c => ({ ...c, status: 'running', message: 'Evaluando...' })));

        // 1. Env check
        const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
        const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

        if (!rawUrl || !rawKey) {
            updateCheck('env', {
                status: 'error',
                message: 'Faltan variables en .env o .env.local (VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY)',
                suggestion: 'Verifica tu archivo .env'
            });
            setIsRunning(false);
            return;
        } else {
            const maskedKey = rawKey.substring(0, 10) + '...' + rawKey.substring(rawKey.length - 4);
            updateCheck('env', {
                status: 'success',
                message: `Variables presentes. URL configurada: ${rawUrl} | Key: ${maskedKey}`
            });
        }

        // 2. URL format
        if (!rawUrl.includes('.supabase.co') && !rawUrl.includes('localhost')) {
            updateCheck('url', {
                status: 'warning',
                message: `La URL '${rawUrl}' no contiene '.supabase.co'. El cliente intentará normalizarla automáticamente.`,
                suggestion: `Recomendado: actualiza .env a '${rawUrl}.supabase.co'`
            });
        } else {
            updateCheck('url', {
                status: 'success',
                message: `Formato de URL correcto: ${rawUrl}`
            });
        }

        // 3. Auth service ping
        const startAuth = performance.now();
        try {
            const { data, error } = await supabase.auth.getSession();
            const time = Math.round(performance.now() - startAuth);
            if (error) {
                updateCheck('ping', {
                    status: 'error',
                    message: `Error en servicio Auth: ${error.message}`,
                    durationMs: time
                });
            } else {
                updateCheck('ping', {
                    status: 'success',
                    message: `Servicio Auth respondió correctamente (Sesión actual: ${data?.session ? 'Iniciada' : 'Anónima'})`,
                    durationMs: time
                });
            }
        } catch (err: any) {
            updateCheck('ping', {
                status: 'error',
                message: `Fallo de conexión de red: ${err.message}`,
                suggestion: 'Verifica conexión a internet y CORS'
            });
        }

        // 4 - 8. Tablas
        const tables = [
            { id: 'table_profiles', name: 'profiles' },
            { id: 'table_florists', name: 'florists' },
            { id: 'table_invitations', name: 'florist_invitations' },
            { id: 'table_applications', name: 'florist_applications' },
            { id: 'table_audit', name: 'application_audit_logs' }
        ];

        for (const tbl of tables) {
            const startTbl = performance.now();
            try {
                const { data, error, status } = await supabase
                    .from(tbl.name)
                    .select('*')
                    .limit(1);
                const time = Math.round(performance.now() - startTbl);

                if (error) {
                    const isNotFound = error.code === 'PGRST204' || error.message.toLowerCase().includes('does not exist');
                    updateCheck(tbl.id, {
                        status: 'error',
                        message: `Status ${status}: [${error.code || 'ERROR'}] ${error.message}`,
                        suggestion: isNotFound ? `La tabla '${tbl.name}' aún no ha sido creada con el script SQL.` : 'Revisa las políticas RLS.',
                        durationMs: time
                    });
                } else {
                    updateCheck(tbl.id, {
                        status: 'success',
                        message: `Acceso concedido. Registros de prueba: ${data?.length ?? 0}`,
                        durationMs: time
                    });
                }
            } catch (err: any) {
                updateCheck(tbl.id, {
                    status: 'error',
                    message: `Excepción: ${err.message}`
                });
            }
        }

        setIsRunning(false);
    };

    useEffect(() => {
        runDiagnostics();
    }, []);

    const allPassed = checks.every(c => c.status === 'success');
    const hasErrors = checks.some(c => c.status === 'error');

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-stone-100">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                            <Database className="w-3.5 h-3.5" />
                            Entorno de Pruebas
                        </div>
                        <h1 className="text-2xl font-bold text-stone-900">Diagnóstico de Conexión a Supabase</h1>
                        <p className="text-sm text-stone-500 mt-1">
                            Verifica la configuración, conectividad de red, autenticación y acceso a tablas para LUNARIA.
                        </p>
                    </div>

                    <button
                        onClick={runDiagnostics}
                        disabled={isRunning}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-sm transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
                        {isRunning ? 'Ejecutando pruebas...' : 'Volver a probar'}
                    </button>
                </div>

                {/* Banner de estado general */}
                <div className="my-6">
                    {isRunning ? (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-3 text-sm">
                            <RefreshCw className="w-5 h-5 animate-spin flex-shrink-0 text-amber-600" />
                            <span>Ejecutando suite de pruebas de conexión en tiempo real...</span>
                        </div>
                    ) : allPassed ? (
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-sm">
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                            <div>
                                <p className="font-semibold">¡Conexión a Supabase 100% Completa y Operativa!</p>
                                <p className="text-xs text-emerald-700 mt-0.5">Todas las variables, servicios de Auth y tablas requeridas por el repositorio responden correctamente.</p>
                            </div>
                        </div>
                    ) : hasErrors ? (
                        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 text-sm">
                            <XCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                            <div>
                                <p className="font-semibold">Se detectaron problemas en la conexión</p>
                                <p className="text-xs text-rose-700 mt-0.5">Revisa el detalle de las pruebas que han fallado abajo para resolverlo.</p>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Lista de Pruebas */}
                <div className="space-y-3">
                    {checks.map((chk) => (
                        <div
                            key={chk.id}
                            className={`p-4 rounded-xl border transition-all ${
                                chk.status === 'success' ? 'bg-stone-50/50 border-stone-200' :
                                chk.status === 'error' ? 'bg-rose-50/40 border-rose-200' :
                                chk.status === 'warning' ? 'bg-amber-50/40 border-amber-200' :
                                'bg-stone-50 border-stone-100'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex-shrink-0">
                                    {chk.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                                    {chk.status === 'error' && <XCircle className="w-5 h-5 text-rose-600" />}
                                    {chk.status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                                    {chk.status === 'running' && <RefreshCw className="w-5 h-5 text-stone-400 animate-spin" />}
                                    {chk.status === 'idle' && <div className="w-5 h-5 rounded-full border-2 border-stone-300" />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-sm font-semibold text-stone-900">{chk.title}</h3>
                                        {chk.durationMs !== undefined && (
                                            <span className="text-xs font-mono text-stone-400">{chk.durationMs}ms</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-stone-600 mt-1 font-mono break-all">{chk.message}</p>
                                    {chk.suggestion && (
                                        <div className="mt-2 text-xs bg-white/80 p-2 rounded-lg border border-stone-200 text-amber-800">
                                            💡 <strong>Sugerencia:</strong> {chk.suggestion}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pie con comando CLI */}
                <div className="mt-8 pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
                    <div className="flex items-center gap-2">
                        <span>También puedes probar desde la terminal con:</span>
                        <code className="px-2 py-1 bg-stone-100 text-stone-800 rounded font-mono font-medium">npm run test:supabase</code>
                    </div>
                    <a
                        href="/"
                        className="inline-flex items-center gap-1.5 text-stone-700 hover:text-stone-900 font-medium"
                    >
                        Volver a Inicio <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                </div>
            </div>
        </div>
    );
}

