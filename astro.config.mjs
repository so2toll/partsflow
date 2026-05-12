// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

import vercel from '@astrojs/vercel';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  devToolbar: {
      enabled: false
    },

  integrations: [
    react(), 
    // …any other integrations you have
  ],

  output: "server",
  adapter: vercel(),

  vite: {
    plugins: [tailwindcss()],
  },
});