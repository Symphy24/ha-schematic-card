# Editor

Early local web app foundation for the future external schematic editor/generator.

The current app is intentionally small: it lets you edit decoded payload JSON manually, import/export `hsc1...` payload strings with `@ha-schematic-card/codec`, and renders a live preview with `@ha-schematic-card/renderer`.

## Run Locally

```sh
npm install
npm run dev -w @ha-schematic-card/editor
```

The dev server prints a local URL.

Manual test flow:

1. Open the local URL.
2. Edit the decoded JSON in the left textarea.
3. Click `Format JSON` to reformat valid payload JSON.
4. Click `Reset Demo` to reload the demo payload.
5. Confirm the preview updates when the JSON is valid.
6. Confirm invalid JSON or schema errors appear in the export panel status.
7. Copy the generated `hsc1...` payload from the right textarea.
8. Paste an existing `hsc1...` payload into the import field and click `Import`.
9. Confirm valid imports replace the decoded JSON and update the preview.
10. Confirm invalid imports show an error without overwriting the decoded JSON.

## Build

```sh
npm run build -w @ha-schematic-card/editor
```

This creates a local static build in `apps/editor/dist`.

This is not a drawing editor yet. Drag/drop, symbol editing, visual schema editing, and project persistence are still future work.
