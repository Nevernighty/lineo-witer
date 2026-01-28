import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Note: componentTagger is disabled due to conflict with @react-three/fiber
// The tagger tries to add data-lov-* attributes to Three.js mesh elements
// which don't support DOM properties, causing runtime errors.

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
