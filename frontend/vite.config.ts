import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separate vendor chunks for better caching
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
            // Group other large dependencies
            if (id.includes('jwt-decode') || id.includes('jsonwebtoken')) {
              return 'jwt-vendor';
            }
            // All other node_modules
            return 'vendor';
          }
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) {
            return `assets/[name]-[hash][extname]`;
          }
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[ext]/[name]-[hash][extname]`;
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Minify for production with esbuild (faster than terser)
    minify: 'esbuild',
    // Enable CSS code splitting and minification
    cssCodeSplit: true,
    cssMinify: true,
    // Source maps for production debugging (disabled for smaller builds)
    sourcemap: false,
    // Target modern browsers for smaller output
    target: 'es2015',
    // Reduce build output size
    reportCompressedSize: true,
    // Optimize asset inlining threshold (4kb)
    assetsInlineLimit: 4096,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    // Exclude large dependencies from pre-bundling if not needed
    exclude: [],
  },

  // CSS optimization
  css: {
    devSourcemap: false,
  },
})