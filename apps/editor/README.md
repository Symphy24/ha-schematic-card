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
6. Use `Add` buttons to create a text, rect, or circle item.
7. Confirm the new item is selected automatically and appears in the preview.
8. Edit simple fields such as `text`, `x`, `y`, or `layer` in the inspector.
9. Use keyboard arrow keys to move positioned items.
10. Hold `Shift` while pressing an arrow key to nudge by 10 units.
11. Click visible top-level items in the preview and confirm the matching item is selected.
12. Drag a selected text, rect, circle, entity value, or symbol item in the preview to move it.
13. Confirm dragging updates the decoded JSON, inspector, preview, and exported payload.
14. Confirm selecting an item scrolls the decoded JSON to that item's `id`.
15. Confirm the decoded JSON section opens automatically if it was collapsed.
16. Confirm the decoded JSON, preview, and exported payload update together.
17. Collapse and expand `Items / Inspector` and `Decoded JSON` with the header buttons.
18. Drag the vertical handle between the editor and preview to resize the left panel.
19. Confirm the item list scrolls inside its section when there are many top-level items.
20. Confirm invalid numeric inspector values show an inspector error without changing the JSON.
21. Confirm invalid JSON or schema errors appear in the export panel status.
22. Open the export side panel from the preview header and copy the generated `hsc1...` payload.
23. Open the import side panel from the preview header, paste an existing `hsc1...` payload, and click `Import`.
24. Confirm valid imports replace the decoded JSON and update the preview.
25. Confirm invalid imports show an error without overwriting the decoded JSON.
26. Paste JSON from the Lovelace editor's `Copy current theme variables` button into `Theme preview JSON`.
27. Click `Apply Theme` and confirm the preview uses the pasted CSS variables, including dark/light card backgrounds.
28. Confirm invalid theme JSON shows a theme error without changing the payload JSON or export.


## Build

```sh
npm run build -w @ha-schematic-card/editor
```

This creates a local static build in `apps/editor/dist`.

This is not a drawing editor yet. Drag/drop, symbol editing, visual schema editing, and project persistence are still future work.
