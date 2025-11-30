/* eslint-disable no-undef */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,  // Frontend port
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",  // Backend port
        changeOrigin: true,
        secure: false
      },
    },
  },
  define: {
    "process.env": process.env,
  },
});
