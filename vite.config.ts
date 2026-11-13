import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// mode "desktop" = painel (instalador Windows e /painel/ na web) · padrão = app do celular
export default defineConfig(({ mode }) => {
  const desktop = mode === 'desktop';
  return {
    base: process.env.BASE ?? './',
    define: { 'import.meta.env.VITE_TARGET': JSON.stringify(desktop ? 'desktop' : 'mobile') },
    build: { outDir: desktop ? 'dist-desktop' : 'dist', emptyOutDir: true },
    plugins: [
      react(),
      VitePWA({
        disable: desktop,
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg'],
        manifest: {
          name: 'Oseki BJJ',
          short_name: 'Oseki BJJ',
          description: 'Presença, faixa e evolução de cada aluno, no tatame e no celular.',
          lang: 'pt-BR',
          theme_color: '#121A24',
          background_color: '#121A24',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '.',
          scope: '.',
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'], navigateFallbackDenylist: [/^\/painel/] },
      }),
    ],
  };
});
