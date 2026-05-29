# Editor

Early local web app foundation for the future external schematic editor/generator.

The current app is intentionally small: it renders the shared demo payload with `@ha-schematic-card/renderer` and exports the same payload as an `hsc1...` string with `@ha-schematic-card/codec`.

## Run Locally

```sh
npm install
npm run dev -w @ha-schematic-card/editor
```

The dev server prints a local URL. Open it to preview the demo schematic and copy the encoded payload.

## Build

```sh
npm run build -w @ha-schematic-card/editor
```

This creates a local static build in `apps/editor/dist`.

This is not a drawing editor yet. Drag/drop, symbol editing, schema editing, and project persistence are still future work.
