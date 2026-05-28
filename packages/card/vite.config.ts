import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const packageDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: resolve(packageDir, "src/index.ts"),
      formats: ["es"],
      fileName: () => "ha-schematic-card.js"
    },
    codeSplitting: false,
    sourcemap: true
  },
  resolve: {
    alias: {
      "@ha-schematic-card/codec": resolve(packageDir, "../codec/src/index.ts"),
      "@ha-schematic-card/renderer": resolve(packageDir, "../renderer/src/index.ts"),
      "@ha-schematic-card/schema": resolve(packageDir, "../schema/src/index.ts")
    }
  }
});
