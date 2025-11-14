import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // 🔥 Render requiere "/" para que React Router funcione
  base: "/",

  // 🔧 Recomendado para desarrollo y compatibilidad
  server: {
    host: true,
    port: 5173
  },

  // 🛠️ Build más limpio para Render
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
