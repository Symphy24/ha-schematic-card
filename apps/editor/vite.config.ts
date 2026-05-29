import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const appDir = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = resolve(appDir, "../..");

export default defineConfig({
  root: appDir,
  build: {
    outDir: "dist",
    emptyOutDir: true
  },
  resolve: {
    alias: {
      "@ha-schematic-card/codec": resolve(repoRoot, "packages/codec/src/index.ts"),
      "@ha-schematic-card/renderer": resolve(repoRoot, "packages/renderer/src/index.ts"),
      "@ha-schematic-card/schema": resolve(repoRoot, "packages/schema/src/index.ts")
    }
  },
  server: {
    fs: {
      allow: [repoRoot]
    }
  }
});
