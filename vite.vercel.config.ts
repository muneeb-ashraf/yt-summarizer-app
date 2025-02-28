import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tsconfigPaths from 'vite-tsconfig-paths';
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";

export default defineConfig({
  plugins: [
    react(),
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
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: path.resolve(__dirname, 'client/index.html'),
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react')) {
              return 'vendor-react';
            }
            if (id.includes('@radix-ui')) {
              return 'vendor-radix';
            }
            if (id.includes('@tanstack')) {
              return 'vendor-tanstack';
            }
            return 'vendor';
          }
          if (id.includes('src/components')) {
            return 'components';
          }
          if (id.includes('src/pages')) {
            return 'pages';
          }
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
      '@tanstack/react-query',
      'wouter',
      '@radix-ui/react-toast',
      '@radix-ui/react-dialog',
      '@radix-ui/react-label',
      '@radix-ui/react-tabs'
    ]
  }
});