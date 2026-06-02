# Editor

Early local web app foundation for the future external schematic editor/generator.

The current app is intentionally small: it lets you edit decoded payload JSON manually, import/export `hsc1...` payload strings with `@ha-schematic-card/codec`, paste Home Assistant theme variables for preview, import simple SVG primitives into safe schema JSON, and renders a live preview with `@ha-schematic-card/renderer`.

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
8. Select a top-level symbol item from `Items`, confirm the tab and inspector show reusable symbol metadata, then edit an entity binding such as `running` or `alarm` and confirm JSON/export update.
9. Open `Symbol Editor` from the top toolbar.
10. Select an existing symbol, confirm the workspace shows a symbol preview, internal items, parts, entity slots, and a small inspector.
11. Click an internal symbol item and confirm it is highlighted in the symbol preview.
12. If a payload has no symbols, click `Create Symbol` and confirm a minimal symbol is added to JSON.
13. Close the symbol workspace and confirm the main editor is still available.
14. Use the top toolbar `Add` buttons to create a text, rect, or circle item.
15. Confirm the new item is selected automatically and appears in the preview.
16. Use `Duplicate` on a selected item and confirm the copy gets a new id, appears slightly offset, and is selected.
17. Use `Delete`, or press `Delete` / `Backspace`, and confirm the selected item is removed.
18. Edit simple fields such as `Text content`, `X position`, `Y position`, or `Layer / z-order` in the inspector.
19. Edit common style fields such as `Stroke / line color`, `Fill / inside color`, `Stroke width`, `Font size`, `Font weight`, `Text anchor`, or `Opacity 0-100%`.
20. Drag sliders for numeric style fields such as opacity while confirming the payload still stores opacity as a 0-1 value.
21. Use the color picker or theme token presets such as `primary text`, `accent`, `error`, or `success` for paint fields.
22. Clear a style field and confirm that style value is removed from the selected item.
23. Use keyboard arrow keys to move positioned items.
24. Hold `Shift` while pressing an arrow key to nudge by 10 units.
25. Click visible top-level items in the preview and confirm the matching item is selected without forcing the `JSON` tab open.
26. Click empty preview space, or press `Escape`, and confirm selection clears and the inspector returns to a neutral state.
27. Open the `JSON` tab manually and confirm the selected item block is selected/scrolled into view.
28. Toggle `Grid On` / `Grid Off` to show or hide the grid overlay.
29. Toggle `Snap On` / `Snap Off` separately to control whether moves snap to the grid.
30. Change the grid size field, for example `5`, `10`, or `20`.
31. Use the mouse wheel over the preview to zoom, and `Fit` to reset the view.
32. Use the pointer tool for selection and the hand tool, or middle mouse drag, to pan the preview.
33. In `Pointer` mode, use Ctrl+click to add/remove items from selection.
34. Drag on empty preview space to box-select multiple items.
35. Confirm the inspector shows a simple multi-select state such as `2 items selected`.
36. Drag, nudge, duplicate, or delete multiple selected items and confirm they update together.
37. Confirm selecting, dragging, grid, and snap still use correct schematic coordinates after zooming or panning.
38. Drag a selected text, rect, circle, entity value, or symbol item in the preview to move it.
39. Confirm dragging follows the pointer without drift.
40. Confirm dragging snaps moved items to the selected grid size when snap is enabled.
41. Hold `Shift` while dragging to temporarily bypass snap without changing the `Snap On` setting.
42. Confirm dragging updates the decoded JSON, inspector, preview, and exported payload.
43. Right-click empty preview space and use `Add` to place text, rect, circle, or polyline at that point.
44. Right-click selected items and use context menu actions for Duplicate, Delete, Layer, Align, and Mirror.
45. Click `Draw Polyline`.
46. Click the first point in the preview.
47. Move the pointer and confirm a temporary rubber-band segment follows the cursor/snap point.
48. Hold `Shift` while drawing and confirm the next segment locks horizontal or vertical.
49. Click more points and confirm the polyline appears as it is built.
50. Click `Finish` or press `Enter` to keep the new polyline.
51. Press `Escape` while drawing another polyline to cancel it.
52. Confirm the finished polyline is selected and appears in the JSON/export.
53. Drag a visible polyline point handle and confirm that one point moves.
54. Right-click a polyline and use `Add point here`.
55. Right-click a polyline and use `Delete nearest point`.
56. Right-click a preview item and use `Bring forward`, `Send backward`, `Bring to front`, or `Send to back`.
57. Confirm the item's `layer` changes in JSON and the preview z-order updates.
58. Confirm deleting is disabled when only two polyline points remain.
59. Confirm the decoded JSON, preview, and exported payload update together.
60. Drag the vertical handle between the editor and preview to resize the left panel.
61. Confirm the item list and inspector scroll inside their tab panels when there are many fields/items.
62. Confirm invalid numeric inspector values show an inspector error without changing the JSON.
63. Click `Undo` / `Redo`, or use `Ctrl+Z` / `Ctrl+Shift+Z`, after add, duplicate, delete, drag, style, layer, inspector, and polyline point edits.
64. Confirm invalid JSON or schema errors appear in the export panel status.
65. Open the export side panel from the top toolbar and copy the generated `hsc1...` payload.
66. Open the import side panel from the top toolbar, paste an existing `hsc1...` payload, and click `Import`.
67. Confirm valid imports replace the decoded JSON and update the preview.
68. Confirm invalid imports show an error without overwriting the decoded JSON.
69. Open the SVG import side panel from the top toolbar, paste the sample below, and click `Import SVG`.
70. Confirm imported items appear in the preview, item list, JSON, and exported `hsc1...` payload.
71. Confirm unsafe SVG such as `<script>` or event handler attributes is rejected without changing the payload.
72. Open the theme side panel from the top toolbar.
73. Paste JSON from the Lovelace editor's `Copy current theme variables` button into `Theme preview JSON`.
74. Click `Apply Theme` and confirm the preview uses the pasted CSS variables, including dark/light card backgrounds.
75. Reload the editor and confirm the last valid theme preview is restored.
76. Confirm invalid theme JSON shows a theme error without changing the payload JSON or export.

Tiny SVG import sample:

```xml
<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <style>
    .st0{fill:#202124}
    .st1{fill:none;stroke:#ffffff;stroke-width:48}
  </style>
  <path id="icon-body" class="st0" d="M 512 96 L 896 800 H 128 Z" />
  <path id="icon-mark" class="st1" d="M 512 320 V 600 M 512 720 V 760" />
  <text id="icon-label" x="512" y="960" fill="currentColor" text-anchor="middle">Imported SVG</text>
</svg>
```

Imported SVG elements are converted into schema JSON and grouped as one top-level item so the imported icon can be selected and moved together. The source `viewBox` is used to scale the group into a reasonable size inside the current schematic viewport. Fill-only paths keep their fill; set a stroke color before changing stroke width if you want an outline.


## Build

```sh
npm run build -w @ha-schematic-card/editor
```

This creates a local static build in `apps/editor/dist`.

The Symbol Editor workspace is a first foundation only. It can load or create one symbol, show its internals, and select internal items, but path editing, ports, simulation, symbol-specific drag/drop, and full symbol editing are still future work.
