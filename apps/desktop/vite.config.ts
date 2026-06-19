import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Tauri expects a fixed port and a clear console it controls.
  clearScreen: false,
  server: {
    // host:true binds 0.0.0.0 so the dev server is reachable from outside the
    // container (Docker port mapping). Harmless for local desktop dev too.
    host: true,
    port: 1420,
    strictPort: true,
  },
  build: {
    target: "es2021",
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
  },
});
