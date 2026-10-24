import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: {
    strictPort: true,
    watch: { ignored: ['**/test-results/**', '**/playwright-report/**'] },
  },
  test: { include: ['src/**/*.test.ts'] },
});
