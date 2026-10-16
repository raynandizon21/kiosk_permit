import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Dev: server/index.js runs Vite as middleware on the same port as the API (see server/app.js).
export default defineConfig({
  plugins: [react(), tailwindcss()]
});
