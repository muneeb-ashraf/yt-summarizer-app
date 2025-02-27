import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ["babel-plugin-react-remove-properties", { properties: ["^data-radix-.*$"] }]
        ]
      }
    }),
    runtimeErrorOverlay(),
    themePlugin({ path: './theme.json' }),
    tsconfigPaths()
  ],
  resolve: {
    alias: {
      "@db": path.resolve(__dirname, "db"),
      "@": path.resolve(__dirname, "client/src"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': [
            'react',
            'react-dom',
            'wouter',
            '@tanstack/react-query',
            '@radix-ui/react-toast',
            '@radix-ui/react-dialog',
            '@radix-ui/react-label'
          ],
          'ui': [
            '@/components/ui',
          ]
        }
      }
    },
    chunkSizeWarningLimit: 800,
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false
  },
  esbuild: {
    logOverride: { 
      "unsupported-color-function": "silent",
      "module-level-directive": "silent" 
    },
    legalComments: 'none',
    target: ['es2020'],
    treeShaking: true
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'wouter',
      '@tanstack/react-query',
      '@radix-ui/react-toast',
      '@radix-ui/react-dialog',
      '@radix-ui/react-label'
    ]
  }
});