import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Tailwind v4+ plugin
  ],
  server: {
    port: 5173,
    strictPort: true,
    // Remove https: false - HTTP is the default
    proxy: {
      // If you want to proxy API during dev instead of CORS, uncomment:
      // "/api": {
      //   target: "https://localhost:7180",
      //   changeOrigin: true,
      //   secure: false
      // }
    }
  },
});