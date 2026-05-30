# Editor

Early local web app foundation for the future external schematic editor/generator.

The current app is intentionally small: it lets you edit decoded payload JSON manually, import/export `hsc1...` payload strings with `@ha-schematic-card/codec`, paste Home Assistant theme variables for preview, and renders a live preview with `@ha-schematic-card/renderer`.

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
5. Select a top-level item from `Items`.
6. Edit simple fields such as `text`, `x`, `y`, or `layer` in the inspector.
7. Confirm the decoded JSON, preview, and exported payload update together.
8. Collapse and expand `Items / Inspector` and `Decoded JSON` with the header buttons.
9. Confirm the item list scrolls inside its section when there are many top-level items.
10. Confirm invalid numeric inspector values show an inspector error without changing the JSON.
11. Confirm invalid JSON or schema errors appear in the export panel status.
12. Copy the generated `hsc1...` payload from the right textarea.
13. Paste an existing `hsc1...` payload into the import field and click `Import`.
14. Confirm valid imports replace the decoded JSON and update the preview.
15. Confirm invalid imports show an error without overwriting the decoded JSON.
16. Paste JSON from the Lovelace editor's `Copy current theme variables` button into `Theme preview JSON`.
17. Click `Apply Theme` and confirm the preview uses the pasted CSS variables.
18. Confirm invalid theme JSON shows a theme error without changing the payload JSON or export.

## Build

```sh
npm run build -w @ha-schematic-card/editor
```

This creates a local static build in `apps/editor/dist`.

This is not a drawing editor yet. Drag/drop, symbol editing, visual schema editing, and project persistence are still future work.
