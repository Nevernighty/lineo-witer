import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Note: componentTagger disabled — conflicts with @react-three/fiber
// (injects DOM attributes into WebGL mesh elements, causing runtime errors)

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
