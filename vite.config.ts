import { defineConfig } from 'vite';
import { devvit } from '@devvit/start/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    devvit({
      client: {
        build: {
          chunkSizeWarningLimit: 2000,
        },
      },
    }),
    react(),
  ],
});
