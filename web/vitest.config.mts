import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Web unit tests (D-17). The process time zone is pinned so browser-local date helpers are
// deterministic on every machine; New York also gives us a DST transition to test against.
process.env.TZ = "America/New_York";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
