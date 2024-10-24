/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
  cacheDir: './node_modules/.vite/near-fastauth-wallet',

  plugins: [react({ include: 'src/ui/*.{js,ts,jsx,tsx}' }), nxViteTsPaths()],

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },

  build: {
    rollupOptions: {
      input: {
        main: './src/index.js', // Adjust this path to your main entry point
        styles: './src/ui/styles.css', // Adjust this path to your generated CSS file
      },
    },
  },

  test: {
    globals: true,
    cache: {
      dir: './node_modules/.vitest',
    },
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
});
