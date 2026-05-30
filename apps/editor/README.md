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
8. Use `Duplicate` on a selected item and confirm the copy gets a new id, appears slightly offset, and is selected.
9. Use `Delete`, or press `Delete` / `Backspace`, and confirm the selected item is removed.
10. Edit simple fields such as `text`, `x`, `y`, or `layer` in the inspector.
11. Edit common style fields such as `stroke`, `fill`, `strokeWidth`, `fontSize`, `fontWeight`, `textAnchor`, or `opacity`.
12. Clear a style field and confirm that style value is removed from the selected item.
13. Use keyboard arrow keys to move positioned items.
14. Hold `Shift` while pressing an arrow key to nudge by 10 units.
15. Click visible top-level items in the preview and confirm the matching item is selected.
16. Toggle `Grid On` / `Grid Off` in the preview header.
17. Change the grid size field, for example `5`, `10`, or `20`.
18. Drag a selected text, rect, circle, entity value, or symbol item in the preview to move it.
19. Confirm dragging follows the pointer without drift.
20. Confirm dragging snaps moved items to the selected grid size when grid is enabled.
21. Confirm dragging updates the decoded JSON, inspector, preview, and exported payload.
22. Click `Draw Polyline`.
23. Click the first point in the preview.
24. Move the pointer and confirm a temporary rubber-band segment follows the cursor/snap point.
25. Hold `Shift` while drawing and confirm the next segment locks horizontal or vertical.
26. Click more points and confirm the polyline appears as it is built.
27. Click `Finish` or press `Enter` to keep the new polyline.
28. Press `Escape` while drawing another polyline to cancel it.
29. Confirm the finished polyline is selected and appears in the JSON/export.
30. Drag a visible polyline point handle and confirm that one point moves.
31. Right-click a polyline and use `Add point here`.
32. Right-click a polyline and use `Delete nearest point`.
33. Right-click a preview item and use `Bring forward`, `Send backward`, `Bring to front`, or `Send to back`.
34. Confirm the item's `layer` changes in JSON and the preview z-order updates.
35. Confirm deleting is disabled when only two polyline points remain.
36. Confirm selecting an item scrolls the decoded JSON to that item's `id`.
37. Confirm the decoded JSON section opens automatically if it was collapsed.
38. Confirm the decoded JSON, preview, and exported payload update together.
39. Collapse and expand `Items / Inspector` and `Decoded JSON` with the header buttons.
40. Drag the vertical handle between the editor and preview to resize the left panel.
41. Drag the horizontal handle between `Items / Inspector` and `Decoded JSON` to resize those sections.
42. Confirm the item list and inspector scroll inside their sections when there are many fields/items.
43. Confirm invalid numeric inspector values show an inspector error without changing the JSON.
44. Click `Undo` / `Redo`, or use `Ctrl+Z` / `Ctrl+Shift+Z`, after add, duplicate, delete, drag, style, layer, inspector, and polyline point edits.
45. Confirm invalid JSON or schema errors appear in the export panel status.
46. Open the export side panel from the preview header and copy the generated `hsc1...` payload.
47. Open the import side panel from the preview header, paste an existing `hsc1...` payload, and click `Import`.
48. Confirm valid imports replace the decoded JSON and update the preview.
49. Confirm invalid imports show an error without overwriting the decoded JSON.
50. Paste JSON from the Lovelace editor's `Copy current theme variables` button into `Theme preview JSON`.
51. Click `Apply Theme` and confirm the preview uses the pasted CSS variables, including dark/light card backgrounds.
52. Confirm invalid theme JSON shows a theme error without changing the payload JSON or export.


## Build

```sh
npm run build -w @ha-schematic-card/editor
```

This creates a local static build in `apps/editor/dist`.

This is not a drawing editor yet. Drag/drop, symbol editing, visual schema editing, and project persistence are still future work.
