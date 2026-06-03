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
10. In the start dialog, choose `Edit existing symbol` to inspect the demo symbol, or `Import SVG` to create a fresh empty import symbol.
11. Confirm the workspace shows a full-size symbol preview, dockable tabs for `Items`, `Parts`, and `Entity Slots`, and an inspector.
12. Drag a Symbol Editor tab into the side panel content area to dock it below the active tab, then drag the docked tab header back to the tab row.
13. Use the Symbol Preview pointer/hand controls to select, zoom with the mouse wheel, pan, fit, clear selection, and delete selected internal items.
14. Click or Ctrl-click internal symbol items in the list or symbol preview, drag-select multiple items, move them together, and use Undo/Redo to step changes back and forward.
15. Open `File` -> `Import SVG` in the Symbol Editor.
16. Paste the Symbol Editor SVG sample below into the floating dialog, or choose/drop a `.svg` file, click `Import SVG`, and confirm the imported group appears as an internal symbol item.
17. Select one of the imported child paths in the internal item list or preview.
18. In the Symbol Editor inspector, edit the internal item id/layer/style and assign it to an existing part, or create a simple new part.
19. Edit a part label in the `Parts` manager, delete a test part with confirmation, and confirm JSON/export update.
20. Add a slot in `Entity Slots`, choose a slot type such as `binary`, `percent`, `temperature`, or `text`, and confirm the simulation controls change.
21. In `Entity Slots`, use the ON/OFF simulation controls for `alarm` and confirm the body part uses the alarm style in the symbol preview.
22. Set `running` simulation to ON and confirm the status part animates in the symbol preview.
23. Add a slot with a percent-like id such as `speed_percent` and confirm it gets a 0-100 simulation slider.
24. Confirm slots without configured effects show `No effect configured`.
25. Confirm imported symbol items appear in the symbol preview, JSON, and exported `hsc1...` payload without becoming top-level schematic items.
26. Confirm the dialog can be closed with `Cancel` or `X`.
27. If a payload has no symbols, click `Create Symbol` and confirm a minimal symbol is added to JSON.
28. Close the symbol workspace and confirm the main editor is still available.
29. Use the top toolbar `Add` buttons to create a text, rect, or circle item.
30. Confirm the new item is selected automatically and appears in the preview.
31. Use `Duplicate` on a selected item and confirm the copy gets a new id, appears slightly offset, and is selected.
32. Use `Delete`, or press `Delete` / `Backspace`, and confirm the selected item is removed.
33. Edit simple fields such as `Text content`, `X position`, `Y position`, or `Layer / z-order` in the inspector.
32. Edit common style fields such as `Stroke / line color`, `Fill / inside color`, `Stroke width`, `Font size`, `Font weight`, `Text anchor`, or `Opacity 0-100%`.
33. Drag sliders for numeric style fields such as opacity while confirming the payload still stores opacity as a 0-1 value.
34. Use the color picker or theme token presets such as `primary text`, `accent`, `error`, or `success` for paint fields.
35. Clear a style field and confirm that style value is removed from the selected item.
36. Use keyboard arrow keys to move positioned items.
37. Toggle `Grid On` / `Grid Off` to show or hide the grid overlay.
38. Toggle `Snap On` / `Snap Off` separately to control whether moves snap to the grid.
39. Change the grid size field, for example `5`, `10`, or `20`.
40. Use the mouse wheel over the preview to zoom, and `Fit` to reset the view.
41. Use the pointer tool for selection and the hand tool, or middle mouse drag, to pan the preview.
42. In `Pointer` mode, use Ctrl+click to add/remove items from selection.
43. Drag on empty preview space to box-select multiple items.
44. Confirm the inspector shows a simple multi-select state such as `2 items selected`.
45. Drag, nudge, duplicate, or delete multiple selected items and confirm they update together.
46. Confirm selecting, dragging, grid, and snap still use correct schematic coordinates after zooming or panning.
47. Drag a selected text, rect, circle, entity value, or symbol item in the preview to move it.
48. Confirm dragging follows the pointer without drift.
49. Confirm dragging snaps moved items to the selected grid size when snap is enabled.
50. Hold `Shift` while dragging to temporarily bypass snap without changing the `Snap On` setting.
51. Confirm dragging updates the decoded JSON, inspector, preview, and exported payload.
52. Right-click empty preview space and use `Add` to place text, rect, circle, or polyline at that point.
53. Right-click selected items and use context menu actions for Duplicate, Delete, Layer, Align, and Mirror.
54. Click `Draw Polyline`.
55. Click the first point in the preview.
56. Move the pointer and confirm a temporary rubber-band segment follows the cursor/snap point.
57. Hold `Shift` while drawing and confirm the next segment locks horizontal or vertical.
58. Click more points and confirm the polyline appears as it is built.
59. Click `Finish` or press `Enter` to keep the new polyline.
60. Press `Escape` while drawing another polyline to cancel it.
61. Confirm the finished polyline is selected and appears in the JSON/export.
62. Drag a visible polyline point handle and confirm that one point moves.
63. Right-click a polyline and use `Add point here`.
64. Right-click a polyline and use `Delete nearest point`.
65. Right-click a preview item and use `Bring forward`, `Send backward`, `Bring to front`, or `Send to back`.
66. Confirm the item's `layer` changes in JSON and the preview z-order updates.
67. Confirm deleting is disabled when only two polyline points remain.
68. Confirm the decoded JSON, preview, and exported payload update together.
69. Drag the vertical handle between the editor and preview to resize the left panel.
70. Confirm the item list and inspector scroll inside their tab panels when there are many fields/items.
71. Confirm invalid numeric inspector values show an inspector error without changing the JSON.
72. Click `Undo` / `Redo`, or use `Ctrl+Z` / `Ctrl+Shift+Z`, after add, duplicate, delete, drag, style, layer, inspector, and polyline point edits.
73. Confirm invalid JSON or schema errors appear in the export panel status.
74. Open the export side panel from the top toolbar and copy the generated `hsc1...` payload.
75. Open the import side panel from the top toolbar, paste an existing `hsc1...` payload, and click `Import`.
76. Confirm valid imports replace the decoded JSON and update the preview.
77. Confirm invalid imports show an error without overwriting the decoded JSON.
78. Open the SVG import side panel from the top toolbar, paste the sample below, and click `Import SVG`.
79. Confirm imported items appear in the preview, item list, JSON, and exported `hsc1...` payload.
80. Confirm unsafe SVG such as `<script>` or event handler attributes is rejected without changing the payload.
81. Open the theme side panel from the top toolbar.
82. Paste JSON from the Lovelace editor's `Copy current theme variables` button into `Theme preview JSON`.
83. Click `Apply Theme` and confirm the preview uses the pasted CSS variables, including dark/light card backgrounds.
84. Reload the editor and confirm the last valid theme preview is restored.
85. Confirm invalid theme JSON shows a theme error without changing the payload JSON or export.

Symbol Editor SVG import sample:

```xml
<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
  <path id="symbol-import-body" d="M 10 10 H 90 V 60 H 10 Z" fill="#202124" />
  <path id="symbol-import-mark" d="M 25 40 H 75" stroke="#ffffff" stroke-width="4" fill="none" />
</svg>
```

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

The Symbol Editor workspace is a first foundation only. It can load or create one symbol, show its internals, edit basic parts/slots metadata, simulate slot states, and move/select internal items, but path editing, ports, and full symbol editing are still future work.
