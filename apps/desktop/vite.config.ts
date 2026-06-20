import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Resolve the workspace SDK from its TypeScript source instead of its
      // built `dist/` output. The package's `exports` only point at `dist`,
      // so without this the dev server (and `vite build`) fail with
      // "Failed to resolve entry for package @snipdash/sdk" whenever the SDK
      // has not been built first. Aliasing to source removes that prerequisite
      // and gives HMR on SDK edits.
      "@snipdash/sdk": fileURLToPath(
        new URL("../../packages/snipdash-sdk/src/index.ts", import.meta.url),
      ),
    },
  },
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
