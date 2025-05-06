import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: { entry: "src/index.ts", name: "tracker", formats: ["iife"] },
    rollupOptions: { output: { name: "tracker" } },
  },
});
