import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// No es necesario importar 'url' ni usar 'fileURLToPath' en las versiones recientes de Vite.
// La forma más simple y robusta es usar `path.resolve` directamente.
// Pero si eso falla, podemos usar una referencia más explícita.
// Vamos a usar la forma más compatible.

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Esta es la forma correcta y moderna de definir el alias
      // sin depender de '__dirname'.
      "@": path.resolve(process.cwd(), "src"),
    },
  },
});