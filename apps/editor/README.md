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
12. Toggle `Grid On` / `Grid Off` in the preview header.
13. Change the grid size field, for example `5`, `10`, or `20`.
14. Drag a selected text, rect, circle, entity value, or symbol item in the preview to move it.
15. Confirm dragging follows the pointer without drift.
16. Confirm dragging snaps moved items to the selected grid size when grid is enabled.
17. Confirm dragging updates the decoded JSON, inspector, preview, and exported payload.
18. Click `Draw Polyline`.
19. Click the first point in the preview.
20. Move the pointer and confirm a temporary rubber-band segment follows the cursor/snap point.
21. Hold `Shift` while drawing and confirm the next segment locks horizontal or vertical.
22. Click more points and confirm the polyline appears as it is built.
23. Click `Finish` or press `Enter` to keep the new polyline.
24. Press `Escape` while drawing another polyline to cancel it.
25. Confirm the finished polyline is selected and appears in the JSON/export.
26. Drag a visible polyline point handle and confirm that one point moves.
27. Right-click a polyline and use `Add point here`.
28. Right-click a polyline and use `Delete nearest point`.
29. Confirm deleting is disabled when only two polyline points remain.
30. Confirm selecting an item scrolls the decoded JSON to that item's `id`.
31. Confirm the decoded JSON section opens automatically if it was collapsed.
32. Confirm the decoded JSON, preview, and exported payload update together.
33. Collapse and expand `Items / Inspector` and `Decoded JSON` with the header buttons.
34. Drag the vertical handle between the editor and preview to resize the left panel.
35. Confirm the item list scrolls inside its section when there are many top-level items.
36. Confirm invalid numeric inspector values show an inspector error without changing the JSON.
37. Click `Undo` / `Redo`, or use `Ctrl+Z` / `Ctrl+Shift+Z`, after add, drag, inspector, and polyline point edits.
38. Confirm invalid JSON or schema errors appear in the export panel status.
39. Open the export side panel from the preview header and copy the generated `hsc1...` payload.
40. Open the import side panel from the preview header, paste an existing `hsc1...` payload, and click `Import`.
41. Confirm valid imports replace the decoded JSON and update the preview.
42. Confirm invalid imports show an error without overwriting the decoded JSON.
43. Paste JSON from the Lovelace editor's `Copy current theme variables` button into `Theme preview JSON`.
44. Click `Apply Theme` and confirm the preview uses the pasted CSS variables, including dark/light card backgrounds.
45. Confirm invalid theme JSON shows a theme error without changing the payload JSON or export.


## Build

```sh
npm run build -w @ha-schematic-card/editor
```

This creates a local static build in `apps/editor/dist`.

This is not a drawing editor yet. Drag/drop, symbol editing, visual schema editing, and project persistence are still future work.
