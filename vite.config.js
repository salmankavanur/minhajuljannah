import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

const config = defineConfig({
  plugins: [preact()],
  base: './',
});

export default config;
