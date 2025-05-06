import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "TrackerBundle",
      formats: ["iife"],
      fileName: () => "tracker.js",
    },
    rollupOptions: {
      output: {
        globals: {},
      },
    },
    minify: false,
  },
});
