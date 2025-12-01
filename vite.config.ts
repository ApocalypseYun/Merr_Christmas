import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Safe access to cwd if types are missing
  const currentDir = (process as any).cwd ? (process as any).cwd() : '.';
  const env = loadEnv(mode, currentDir, '');
  return {
    plugins: [react()],
    base: './', // Ensures assets are loaded correctly on GitHub Pages (subdirectory support)
    define: {
      // Shim process.env for the application code
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || ''),
    },
    build: {
      outDir: 'dist',
    }
  };
});