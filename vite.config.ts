import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, Plugin} from 'vite';
import {createPaymentsApi, PaymentsConfig} from './server/payments';

/**
 * Monta la API de pagos (server/payments.ts) en /api, tanto en `npm run dev`
 * como en `npm run preview`. Así no hace falta levantar un servidor aparte.
 */
function paymentsApiPlugin(config: PaymentsConfig): Plugin {
  return {
    name: 'lunaria-payments-api',
    configureServer(server) {
      server.middlewares.use('/api', createPaymentsApi(config));
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api', createPaymentsApi(config));
    },
  };
}

export default defineConfig(({mode}) => {
  // '' = carga TODAS las variables (también las que no empiezan con VITE_).
  // Las variables sin prefijo VITE_ (como STRIPE_SECRET_KEY) solo las ve el servidor, nunca el navegador.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      paymentsApiPlugin({
        stripeSecretKey: env.STRIPE_SECRET_KEY?.trim() || undefined,
        stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET?.trim() || undefined,
        supabaseUrl: env.VITE_SUPABASE_URL?.trim() || '',
        supabaseKey: env.VITE_SUPABASE_ANON_KEY?.trim() || '',
        appUrl: env.APP_URL?.startsWith('http') ? env.APP_URL : undefined,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
