import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tsconfigPaths from 'vite-tsconfig-paths';
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
      babel: {
        plugins: []
      }
    }),
    tsconfigPaths(),
    themePlugin()
  ],
  base: '/',
  root: path.resolve(__dirname, 'client'),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
    },
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          config: path.resolve(__dirname, 'tailwind.config.ts')
        }),
        autoprefixer()
      ]
    }
  },
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: path.resolve(__dirname, 'client/index.html'),
      output: {
        manualChunks: {
          'vendor': [
            'react',
            'react-dom',
            'react/jsx-runtime',
            '@tanstack/react-query',
            'wouter'
          ],
          'ui': [
            '@radix-ui/react-toast',
            '@radix-ui/react-dialog',
            '@radix-ui/react-label',
            '@radix-ui/react-tabs'
          ]
        }
      }
    },
    minify: 'esbuild',
    sourcemap: false
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@tanstack/react-query',
      'wouter'
    ],
    exclude: []
  }
});