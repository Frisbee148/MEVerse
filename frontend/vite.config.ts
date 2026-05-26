import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the build works when served from the FastAPI app at "/".
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: { outDir: "dist", emptyOutDir: true },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:7860",
    },
  },
});
