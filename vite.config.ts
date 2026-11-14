/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/sabor-de-pastel/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "src/setupTests.ts",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
