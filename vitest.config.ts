import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
      // `server-only` is a runtime guard Next.js ships; it has no real code
      // and isn't published to npm, so we stub it for the test runner.
      "server-only": path.resolve(rootDir, "./src/test/stubs/server-only.ts"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: false,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "node_modules/",
        ".next/",
        "src/**/*.d.ts",
        "src/app/**",
        "src/components/ui/**",
        "src/infrastructure/mocks/**",
        "**/*.config.*",
      ],
    },
  },
});
