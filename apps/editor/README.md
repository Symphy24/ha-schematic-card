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
2. Use the left panel tabs for `Items`, `Inspector`, and `JSON`.
3. Drag a tab into the panel content area to split it into a top and bottom dock, then drag the docked panel header back to the tab row to restore it.
4. Edit the decoded JSON in the `JSON` tab.
5. Use the top toolbar for global actions such as `Select`, `Undo`, `Redo`, `Import`, `Export`, and `Theme`.
6. Click `Format JSON` to reformat valid payload JSON.
7. Click `Reset Demo` to reload the demo payload.
8. Select a top-level item from `Items`.
9. Use the top toolbar `Add` buttons to create a text, rect, or circle item.
10. Confirm the new item is selected automatically and appears in the preview.
11. Use `Duplicate` on a selected item and confirm the copy gets a new id, appears slightly offset, and is selected.
12. Use `Delete`, or press `Delete` / `Backspace`, and confirm the selected item is removed.
13. Edit simple fields such as `Text content`, `X position`, `Y position`, or `Layer / z-order` in the inspector.
14. Edit common style fields such as `Stroke / line color`, `Fill / inside color`, `Stroke width`, `Font size`, `Font weight`, `Text anchor`, or `Opacity 0-100%`.
15. Drag sliders for numeric style fields such as opacity while confirming the payload still stores opacity as a 0-1 value.
16. Use the color picker or theme token presets such as `primary text`, `accent`, `error`, or `success` for paint fields.
17. Clear a style field and confirm that style value is removed from the selected item.
18. Use keyboard arrow keys to move positioned items.
19. Hold `Shift` while pressing an arrow key to nudge by 10 units.
20. Click visible top-level items in the preview and confirm the matching item is selected without forcing the `JSON` tab open.
21. Click empty preview space, or press `Escape`, and confirm selection clears and the inspector returns to a neutral state.
22. Open the `JSON` tab manually and confirm the selected item block is selected/scrolled into view.
23. Toggle `Grid On` / `Grid Off` to show or hide the grid overlay.
24. Toggle `Snap On` / `Snap Off` separately to control whether moves snap to the grid.
25. Change the grid size field, for example `5`, `10`, or `20`.
26. Use the mouse wheel over the preview to zoom, and `Fit` to reset the view.
27. Use the pointer tool for selection and the hand tool, or middle mouse drag, to pan the preview.
28. In `Pointer` mode, use Ctrl+click to add/remove items from selection.
29. Drag on empty preview space to box-select multiple items.
30. Confirm selecting, dragging, grid, and snap still use correct schematic coordinates after zooming or panning.
31. Drag a selected text, rect, circle, entity value, or symbol item in the preview to move it.
32. Confirm dragging follows the pointer without drift.
33. Confirm dragging snaps moved items to the selected grid size when snap is enabled.
34. Confirm dragging updates the decoded JSON, inspector, preview, and exported payload.
35. Click `Draw Polyline`.
36. Click the first point in the preview.
37. Move the pointer and confirm a temporary rubber-band segment follows the cursor/snap point.
38. Hold `Shift` while drawing and confirm the next segment locks horizontal or vertical.
39. Click more points and confirm the polyline appears as it is built.
40. Click `Finish` or press `Enter` to keep the new polyline.
41. Press `Escape` while drawing another polyline to cancel it.
42. Confirm the finished polyline is selected and appears in the JSON/export.
43. Drag a visible polyline point handle and confirm that one point moves.
44. Right-click a polyline and use `Add point here`.
45. Right-click a polyline and use `Delete nearest point`.
46. Right-click a preview item and use `Bring forward`, `Send backward`, `Bring to front`, or `Send to back`.
47. Confirm the item's `layer` changes in JSON and the preview z-order updates.
48. Confirm deleting is disabled when only two polyline points remain.
49. Confirm the decoded JSON, preview, and exported payload update together.
50. Drag the vertical handle between the editor and preview to resize the left panel.
51. Confirm the item list and inspector scroll inside their tab panels when there are many fields/items.
52. Confirm invalid numeric inspector values show an inspector error without changing the JSON.
53. Click `Undo` / `Redo`, or use `Ctrl+Z` / `Ctrl+Shift+Z`, after add, duplicate, delete, drag, style, layer, inspector, and polyline point edits.
54. Confirm invalid JSON or schema errors appear in the export panel status.
55. Open the export side panel from the top toolbar and copy the generated `hsc1...` payload.
56. Open the import side panel from the top toolbar, paste an existing `hsc1...` payload, and click `Import`.
57. Confirm valid imports replace the decoded JSON and update the preview.
58. Confirm invalid imports show an error without overwriting the decoded JSON.
59. Open the theme side panel from the top toolbar.
60. Paste JSON from the Lovelace editor's `Copy current theme variables` button into `Theme preview JSON`.
61. Click `Apply Theme` and confirm the preview uses the pasted CSS variables, including dark/light card backgrounds.
62. Reload the editor and confirm the last valid theme preview is restored.
63. Confirm invalid theme JSON shows a theme error without changing the payload JSON or export.


## Build

```sh
npm run build -w @ha-schematic-card/editor
```

This creates a local static build in `apps/editor/dist`.

This is not a drawing editor yet. Drag/drop, symbol editing, visual schema editing, and project persistence are still future work.
