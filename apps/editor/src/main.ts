import { decodePayload, encodePayload } from "@ha-schematic-card/codec";
import { renderSchematicSvg } from "@ha-schematic-card/renderer";
import {
  isSchematicPayload,
  type SchematicPayload,
  type SchematicItem,
  type SchematicPoint,
  type SchematicStyle,
  validateSchematicPayload
} from "@ha-schematic-card/schema";

import demoPayloadJson from "../../../examples/demo-payloads/minimal.json";

const demoPayload = demoPayloadJson as SchematicPayload;
const DEFAULT_EDITOR_GRID_SIZE = 10;
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const THEME_STORAGE_KEY = "ha-schematic-card-editor-theme-preview";

const demoEntityStates = {
  "input_boolean.schematic_demo_alarm": "on",
  "input_boolean.schematic_demo_flow": "on",
  "input_number.schematic_demo_temperature": {
    state: "21.26",
    attributes: {
      unit_of_measurement: "C"
    }
  }
} as const;

type EditorElements = {
  editorRoot: HTMLElement;
  jsonInput: HTMLTextAreaElement;
  itemList: HTMLElement;
  symbolSummary: HTMLElement;
  itemsTabButton: HTMLButtonElement;
  inspectorTabButton: HTMLButtonElement;
  jsonTabButton: HTMLButtonElement;
  primaryPanel: HTMLElement;
  dockedPanel: HTMLElement;
  dockedPanelTab: HTMLButtonElement;
  tabDropZone: HTMLElement;
  itemListSection: HTMLElement;
  inspectorSection: HTMLElement;
  jsonSection: HTMLElement;
  selectToolButton: HTMLButtonElement;
  addTextButton: HTMLButtonElement;
  addRectButton: HTMLButtonElement;
  addCircleButton: HTMLButtonElement;
  duplicateItemButton: HTMLButtonElement;
  deleteItemButton: HTMLButtonElement;
  inspector: HTMLElement;
  inspectorStatus: HTMLElement;
  previewSurface: HTMLElement;
  themeInput: HTMLTextAreaElement;
  themeStatus: HTMLElement;
  transferPanel: HTMLElement;
  transferPanelTitle: HTMLElement;
  importSection: HTMLElement;
  exportSection: HTMLElement;
  importInput: HTMLTextAreaElement;
  exportOutput: HTMLTextAreaElement;
  status: HTMLElement;
  copyButton: HTMLButtonElement;
  applyThemeButton: HTMLButtonElement;
  openImportButton: HTMLButtonElement;
  openExportButton: HTMLButtonElement;
  openThemeButton: HTMLButtonElement;
  toggleGridButton: HTMLButtonElement;
  toggleSnapButton: HTMLButtonElement;
  panToolButton: HTMLButtonElement;
  resetViewButton: HTMLButtonElement;
  gridSizeInput: HTMLInputElement;
  drawPolylineButton: HTMLButtonElement;
  finishPolylineButton: HTMLButtonElement;
  polylineContextMenu: HTMLElement;
  addPolylinePointButton: HTMLButtonElement;
  deletePolylinePointButton: HTMLButtonElement;
  bringForwardButton: HTMLButtonElement;
  sendBackwardButton: HTMLButtonElement;
  bringToFrontButton: HTMLButtonElement;
  sendToBackButton: HTMLButtonElement;
  alignLeftButton: HTMLButtonElement;
  alignRightButton: HTMLButtonElement;
  alignTopButton: HTMLButtonElement;
  alignBottomButton: HTMLButtonElement;
  alignCenterButton: HTMLButtonElement;
  mirrorHorizontalButton: HTMLButtonElement;
  mirrorVerticalButton: HTMLButtonElement;
  contextDuplicateButton: HTMLButtonElement;
  contextDeleteButton: HTMLButtonElement;
  addTextContextButton: HTMLButtonElement;
  addRectContextButton: HTMLButtonElement;
  addCircleContextButton: HTMLButtonElement;
  addPolylineContextButton: HTMLButtonElement;
  closeTransferPanelButton: HTMLButtonElement;
  importButton: HTMLButtonElement;
  formatButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
  undoButton: HTMLButtonElement;
  redoButton: HTMLButtonElement;
  selectedItemId?: string;
  selectedItemIds: string[];
  gridEnabled: boolean;
  snapEnabled: boolean;
  gridSize: number;
  panMode: boolean;
  previewViewBox?: PreviewViewBox;
  activeTab: EditorTabName;
  dockedTab?: EditorTabName;
  draggedTab?: EditorTabName;
  undoStack: EditorSnapshot[];
  redoStack: EditorSnapshot[];
  dragState?: PreviewDragState;
  pointDragState?: PolylinePointDragState;
  drawState?: PolylineDrawState;
  panState?: PreviewPanState;
  selectionRectState?: SelectionRectState;
  selectionRectClickSuppressionPoint?: { clientX: number; clientY: number };
  contextMenuState?: PolylineContextMenuState;
};

type PreviewViewBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type PreviewDragState = {
  itemId: string;
  startPoint: SchematicPoint;
  startItems: Array<{
    itemId: string;
    item: SchematicItem;
  }>;
  coordinateSpace: SvgCoordinateSpace;
  historyRecorded: boolean;
};

type PolylinePointDragState = {
  itemId: string;
  pointIndex: number;
  startPoint: SchematicPoint;
  startItem: SchematicItem;
  coordinateSpace: SvgCoordinateSpace;
  historyRecorded: boolean;
};

type PolylineDrawState = {
  itemId: string;
  points: SchematicPoint[];
  previewPoint?: SchematicPoint;
  shiftKey?: boolean;
};

type PolylineContextMenuState = {
  itemId?: string;
  insertIndex?: number;
  nearestPointIndex?: number;
  point?: SchematicPoint;
};

type PreviewPanState = {
  svg: SVGSVGElement;
  startClientX: number;
  startClientY: number;
  startViewBox: PreviewViewBox;
  moved: boolean;
};

type SelectionRectState = {
  svg: SVGSVGElement;
  startPoint: SchematicPoint;
  currentPoint: SchematicPoint;
  moved: boolean;
};

type LayerAction = "forward" | "backward" | "front" | "back";
type AlignAction = "left" | "right" | "top" | "bottom" | "center";
type MirrorAction = "horizontal" | "vertical";

type AddItemType = "text" | "rect" | "circle" | "polyline";

type EditorTabName = "items" | "inspector" | "json";

type StyleFieldName = keyof SchematicStyle;

type StyleFieldValueType = "number" | "string" | "fontWeight" | "textAnchor";

type StyleFieldConfig = {
  name: StyleFieldName;
  valueType: StyleFieldValueType;
};

type ThemeTokenPreset = {
  label: string;
  value: string;
};

type StyleSliderConfig = {
  min: number;
  max: number;
  step: number;
  fallback: number;
};

const THEME_TOKEN_PRESETS: ThemeTokenPreset[] = [
  { label: "primary text", value: "var(--primary-text-color)" },
  { label: "secondary text", value: "var(--secondary-text-color)" },
  { label: "accent", value: "var(--accent-color)" },
  { label: "error", value: "var(--error-color)" },
  { label: "warning", value: "var(--warning-color)" },
  { label: "success", value: "var(--success-color)" },
  { label: "divider", value: "var(--divider-color)" }
];

const INSPECTOR_FIELD_LABELS: Record<"id" | "layer" | "x" | "y" | "text", string> = {
  id: "Item id",
  layer: "Layer / z-order",
  x: "X position",
  y: "Y position",
  text: "Text content"
};

const STYLE_FIELD_LABELS: Record<StyleFieldName, string> = {
  stroke: "Stroke / line color",
  strokeWidth: "Stroke width",
  strokeDasharray: "Stroke dash pattern",
  fill: "Fill / inside color",
  opacity: "Opacity 0-100%",
  fontSize: "Font size",
  fontWeight: "Font weight",
  textAnchor: "Text anchor"
};

const STYLE_FIELD_HELPERS: Partial<Record<StyleFieldName, string>> = {
  stroke: "Use a color, none, or a Home Assistant CSS variable.",
  fill: "Use a color, none, transparent, or a theme token.",
  strokeWidth: "Line width in SVG units.",
  strokeDasharray: "Numbers separated by spaces or commas.",
  opacity: "0 is transparent, 100 is solid. Stored as schema opacity 0-1.",
  fontSize: "Text size in SVG units.",
  fontWeight: "normal, bold, or a numeric weight.",
  textAnchor: "start, middle, or end."
};

const PAINT_STYLE_FIELDS: StyleFieldConfig[] = [
  { name: "stroke", valueType: "string" },
  { name: "fill", valueType: "string" },
  { name: "strokeWidth", valueType: "number" },
  { name: "opacity", valueType: "number" }
];

const LINE_STYLE_FIELDS: StyleFieldConfig[] = [
  { name: "stroke", valueType: "string" },
  { name: "strokeWidth", valueType: "number" },
  { name: "strokeDasharray", valueType: "string" },
  { name: "fill", valueType: "string" },
  { name: "opacity", valueType: "number" }
];

const TEXT_STYLE_FIELDS: StyleFieldConfig[] = [
  { name: "fill", valueType: "string" },
  { name: "stroke", valueType: "string" },
  { name: "fontSize", valueType: "number" },
  { name: "fontWeight", valueType: "fontWeight" },
  { name: "textAnchor", valueType: "textAnchor" },
  { name: "opacity", valueType: "number" }
];

type EditorSnapshot = {
  json: string;
  selectedItemId?: string;
  selectedItemIds?: string[];
};

type SvgCoordinateSpace = {
  viewBox?: PreviewViewBox;
  bounds: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
};

export function getDemoPayload(): SchematicPayload {
  return demoPayload;
}

export function formatPayloadJson(payload: SchematicPayload = demoPayload): string {
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function encodeDemoPayload(payload: SchematicPayload = demoPayload): string {
  return encodePayload(payload);
}

export function createEditorApp(documentRef: Document = document): HTMLElement {
  const shell = documentRef.createElement("section");
  shell.className = "editor-shell";
  shell.tabIndex = -1;

  const toolbar = createGlobalToolbar(documentRef);
  const jsonPane = createJsonPane(documentRef);
  const previewPane = createPreviewPane(documentRef);
  const resizeHandle = createResizeHandle(documentRef, shell);
  const transferPanel = createTransferPanel(documentRef);

  const elements: EditorElements = {
    editorRoot: shell,
    jsonInput: getRequiredElement(jsonPane, ".json-input", HTMLTextAreaElement),
    itemList: getRequiredElement(jsonPane, ".item-list", HTMLElement),
    symbolSummary: getRequiredElement(jsonPane, ".symbol-summary", HTMLElement),
    itemsTabButton: getRequiredElement(jsonPane, '[data-editor-tab="items"]', HTMLButtonElement),
    inspectorTabButton: getRequiredElement(jsonPane, '[data-editor-tab="inspector"]', HTMLButtonElement),
    jsonTabButton: getRequiredElement(jsonPane, '[data-editor-tab="json"]', HTMLButtonElement),
    primaryPanel: getRequiredElement(jsonPane, ".editor-primary-panel", HTMLElement),
    dockedPanel: getRequiredElement(jsonPane, ".editor-docked-panel", HTMLElement),
    dockedPanelTab: getRequiredElement(jsonPane, ".editor-docked-tab", HTMLButtonElement),
    tabDropZone: getRequiredElement(jsonPane, ".editor-tab-drop-zone", HTMLElement),
    itemListSection: getRequiredElement(jsonPane, ".item-list-section", HTMLElement),
    inspectorSection: getRequiredElement(jsonPane, ".inspector-section", HTMLElement),
    jsonSection: getRequiredElement(jsonPane, ".json-editor-section", HTMLElement),
    selectToolButton: getRequiredElement(toolbar, ".select-tool-button", HTMLButtonElement),
    addTextButton: getRequiredElement(toolbar, ".add-text-button", HTMLButtonElement),
    addRectButton: getRequiredElement(toolbar, ".add-rect-button", HTMLButtonElement),
    addCircleButton: getRequiredElement(toolbar, ".add-circle-button", HTMLButtonElement),
    duplicateItemButton: getRequiredElement(toolbar, ".duplicate-item-button", HTMLButtonElement),
    deleteItemButton: getRequiredElement(toolbar, ".delete-item-button", HTMLButtonElement),
    inspector: getRequiredElement(jsonPane, ".property-inspector", HTMLElement),
    inspectorStatus: getRequiredElement(jsonPane, ".inspector-status", HTMLElement),
    previewSurface: getRequiredElement(previewPane, ".preview-surface", HTMLElement),
    themeInput: getRequiredElement(transferPanel, ".theme-input", HTMLTextAreaElement),
    themeStatus: getRequiredElement(transferPanel, ".theme-status", HTMLElement),
    transferPanel: getRequiredElement(transferPanel, ".transfer-panel", HTMLElement),
    transferPanelTitle: getRequiredElement(transferPanel, ".transfer-panel-title", HTMLElement),
    importSection: getRequiredElement(transferPanel, ".import-section", HTMLElement),
    exportSection: getRequiredElement(transferPanel, ".export-section", HTMLElement),
    importInput: getRequiredElement(transferPanel, ".import-input", HTMLTextAreaElement),
    exportOutput: getRequiredElement(transferPanel, ".payload-output", HTMLTextAreaElement),
    status: getRequiredElement(transferPanel, ".status", HTMLElement),
    copyButton: getRequiredElement(transferPanel, ".copy-button", HTMLButtonElement),
    applyThemeButton: getRequiredElement(transferPanel, ".apply-theme-button", HTMLButtonElement),
    openImportButton: getRequiredElement(toolbar, ".open-import-button", HTMLButtonElement),
    openExportButton: getRequiredElement(toolbar, ".open-export-button", HTMLButtonElement),
    openThemeButton: getRequiredElement(toolbar, ".open-theme-button", HTMLButtonElement),
    toggleGridButton: getRequiredElement(previewPane, ".toggle-grid-button", HTMLButtonElement),
    toggleSnapButton: getRequiredElement(previewPane, ".toggle-snap-button", HTMLButtonElement),
    panToolButton: getRequiredElement(toolbar, ".pan-tool-button", HTMLButtonElement),
    resetViewButton: getRequiredElement(previewPane, ".reset-view-button", HTMLButtonElement),
    gridSizeInput: getRequiredElement(previewPane, ".grid-size-input", HTMLInputElement),
    drawPolylineButton: getRequiredElement(toolbar, ".draw-polyline-button", HTMLButtonElement),
    finishPolylineButton: getRequiredElement(toolbar, ".finish-polyline-button", HTMLButtonElement),
    polylineContextMenu: getRequiredElement(previewPane, ".polyline-context-menu", HTMLElement),
    addPolylinePointButton: getRequiredElement(previewPane, ".add-polyline-point-button", HTMLButtonElement),
    deletePolylinePointButton: getRequiredElement(previewPane, ".delete-polyline-point-button", HTMLButtonElement),
    bringForwardButton: getRequiredElement(previewPane, ".bring-forward-button", HTMLButtonElement),
    sendBackwardButton: getRequiredElement(previewPane, ".send-backward-button", HTMLButtonElement),
    bringToFrontButton: getRequiredElement(previewPane, ".bring-to-front-button", HTMLButtonElement),
    sendToBackButton: getRequiredElement(previewPane, ".send-to-back-button", HTMLButtonElement),
    alignLeftButton: getRequiredElement(previewPane, ".align-left-button", HTMLButtonElement),
    alignRightButton: getRequiredElement(previewPane, ".align-right-button", HTMLButtonElement),
    alignTopButton: getRequiredElement(previewPane, ".align-top-button", HTMLButtonElement),
    alignBottomButton: getRequiredElement(previewPane, ".align-bottom-button", HTMLButtonElement),
    alignCenterButton: getRequiredElement(previewPane, ".align-center-button", HTMLButtonElement),
    mirrorHorizontalButton: getRequiredElement(previewPane, ".mirror-horizontal-button", HTMLButtonElement),
    mirrorVerticalButton: getRequiredElement(previewPane, ".mirror-vertical-button", HTMLButtonElement),
    contextDuplicateButton: getRequiredElement(previewPane, ".context-duplicate-button", HTMLButtonElement),
    contextDeleteButton: getRequiredElement(previewPane, ".context-delete-button", HTMLButtonElement),
    addTextContextButton: getRequiredElement(previewPane, ".add-text-context-button", HTMLButtonElement),
    addRectContextButton: getRequiredElement(previewPane, ".add-rect-context-button", HTMLButtonElement),
    addCircleContextButton: getRequiredElement(previewPane, ".add-circle-context-button", HTMLButtonElement),
    addPolylineContextButton: getRequiredElement(previewPane, ".add-polyline-context-button", HTMLButtonElement),
    closeTransferPanelButton: getRequiredElement(transferPanel, ".transfer-panel-close", HTMLButtonElement),
    importButton: getRequiredElement(transferPanel, ".import-button", HTMLButtonElement),
    formatButton: getRequiredElement(toolbar, ".format-button", HTMLButtonElement),
    resetButton: getRequiredElement(toolbar, ".reset-button", HTMLButtonElement),
    undoButton: getRequiredElement(toolbar, ".undo-button", HTMLButtonElement),
    redoButton: getRequiredElement(toolbar, ".redo-button", HTMLButtonElement),
    selectedItemIds: [],
    gridEnabled: true,
    snapEnabled: true,
    gridSize: DEFAULT_EDITOR_GRID_SIZE,
    panMode: false,
    activeTab: "items",
    undoStack: [],
    redoStack: []
  };

  elements.jsonInput.value = formatPayloadJson();
  loadStoredThemePreview(elements);
  elements.jsonInput.addEventListener("input", () => updateFromJson(elements, documentRef));
  elements.copyButton.addEventListener("click", async () => copyExportedPayload(elements));
  elements.applyThemeButton.addEventListener("click", () => applyThemePreview(elements));
  elements.openImportButton.addEventListener("click", () => openTransferPanel(elements, "import"));
  elements.openExportButton.addEventListener("click", () => openTransferPanel(elements, "export"));
  elements.openThemeButton.addEventListener("click", () => openTransferPanel(elements, "theme"));
  elements.selectToolButton.addEventListener("click", () => activateSelectTool(elements, documentRef));
  elements.toggleGridButton.addEventListener("click", () => togglePreviewGrid(elements, documentRef));
  elements.toggleSnapButton.addEventListener("click", () => toggleSnap(elements));
  elements.panToolButton.addEventListener("click", () => togglePanMode(elements));
  elements.resetViewButton.addEventListener("click", () => resetPreviewView(elements));
  elements.gridSizeInput.addEventListener("change", () => updateGridSize(elements, documentRef));
  elements.drawPolylineButton.addEventListener("click", () => startPolylineDrawing(elements, documentRef));
  elements.finishPolylineButton.addEventListener("click", () => finishPolylineDrawing(elements, documentRef));
  elements.addPolylinePointButton.addEventListener("click", () => addPolylinePointFromContextMenu(elements, documentRef));
  elements.deletePolylinePointButton.addEventListener("click", () => deletePolylinePointFromContextMenu(elements, documentRef));
  elements.bringForwardButton.addEventListener("click", () => changeSelectedItemLayer(elements, "forward", documentRef));
  elements.sendBackwardButton.addEventListener("click", () => changeSelectedItemLayer(elements, "backward", documentRef));
  elements.bringToFrontButton.addEventListener("click", () => changeSelectedItemLayer(elements, "front", documentRef));
  elements.sendToBackButton.addEventListener("click", () => changeSelectedItemLayer(elements, "back", documentRef));
  elements.alignLeftButton.addEventListener("click", () => alignSelectedItems(elements, "left", documentRef));
  elements.alignRightButton.addEventListener("click", () => alignSelectedItems(elements, "right", documentRef));
  elements.alignTopButton.addEventListener("click", () => alignSelectedItems(elements, "top", documentRef));
  elements.alignBottomButton.addEventListener("click", () => alignSelectedItems(elements, "bottom", documentRef));
  elements.alignCenterButton.addEventListener("click", () => alignSelectedItems(elements, "center", documentRef));
  elements.mirrorHorizontalButton.addEventListener("click", () => mirrorSelectedItems(elements, "horizontal", documentRef));
  elements.mirrorVerticalButton.addEventListener("click", () => mirrorSelectedItems(elements, "vertical", documentRef));
  elements.contextDuplicateButton.addEventListener("click", () => duplicateSelectedItemFromContextMenu(elements, documentRef));
  elements.contextDeleteButton.addEventListener("click", () => deleteSelectedItemFromContextMenu(elements, documentRef));
  elements.addTextContextButton.addEventListener("click", () => addItemFromContextMenu(elements, "text", documentRef));
  elements.addRectContextButton.addEventListener("click", () => addItemFromContextMenu(elements, "rect", documentRef));
  elements.addCircleContextButton.addEventListener("click", () => addItemFromContextMenu(elements, "circle", documentRef));
  elements.addPolylineContextButton.addEventListener("click", () => addItemFromContextMenu(elements, "polyline", documentRef));
  elements.closeTransferPanelButton.addEventListener("click", () => closeTransferPanel(elements));
  elements.importButton.addEventListener("click", () => importEncodedPayload(elements, documentRef));
  elements.addTextButton.addEventListener("click", () => addItem(elements, "text", documentRef));
  elements.addRectButton.addEventListener("click", () => addItem(elements, "rect", documentRef));
  elements.addCircleButton.addEventListener("click", () => addItem(elements, "circle", documentRef));
  elements.duplicateItemButton.addEventListener("click", () => duplicateSelectedItem(elements, documentRef));
  elements.deleteItemButton.addEventListener("click", () => deleteSelectedItem(elements, documentRef));
  elements.formatButton.addEventListener("click", () => formatCurrentJson(elements, documentRef));
  elements.resetButton.addEventListener("click", () => resetDemoPayload(elements, documentRef));
  elements.undoButton.addEventListener("click", () => undoEditorChange(elements, documentRef));
  elements.redoButton.addEventListener("click", () => redoEditorChange(elements, documentRef));
  elements.itemsTabButton.addEventListener("click", () => showEditorTab(elements, "items"));
  elements.inspectorTabButton.addEventListener("click", () => showEditorTab(elements, "inspector"));
  elements.jsonTabButton.addEventListener("click", () => showEditorTab(elements, "json"));
  setupEditorTabDocking(elements);
  shell.addEventListener("keydown", (event) => handleEditorKeyDown(elements, event, documentRef));

  shell.append(toolbar, jsonPane, resizeHandle, previewPane, transferPanel);
  updateFromJson(elements, documentRef);

  return shell;
}

export function mountEditorApp(root: HTMLElement | null = document.getElementById("app")): void {
  if (!root) {
    return;
  }

  root.replaceChildren(createEditorApp(root.ownerDocument));
}

function updateFromJson(
  elements: EditorElements,
  documentRef: Document,
  options: { renderTools?: boolean } = {}
): void {
  const renderTools = options.renderTools ?? true;
  const result = parseAndValidatePayload(elements.jsonInput.value);

  elements.previewSurface.replaceChildren();
  elements.exportOutput.value = "";
  updateHistoryControls(elements);

  if (!result.ok) {
    renderDisabledItemTools(elements, result.message);
    elements.status.textContent = result.message;
    elements.status.dataset.state = "error";
    return;
  }

  const svg = renderSchematicSvg(result.payload, {
    document: documentRef,
    entityStates: demoEntityStates
  });
  applyPreviewViewBox(elements, svg, result.payload);
  renderPreviewGrid(svg, result.payload, elements.gridEnabled, elements.gridSize, documentRef);
  renderPolylineRubberBand(svg, elements.drawState, documentRef);
  renderSelectionRectangle(svg, elements.selectionRectState, documentRef);
  renderPolylineHandles(svg, result.payload, elements.selectedItemId, elements.drawState, documentRef);
  svg.addEventListener("click", (event) => handlePreviewClick(elements, result.payload, event, documentRef));
  svg.addEventListener("wheel", (event) => handlePreviewWheel(elements, event));
  svg.addEventListener("mousemove", (event) => updatePolylineRubberBand(elements, event, documentRef));
  svg.addEventListener("mousedown", (event) => handlePreviewMouseDown(elements, result.payload, event, documentRef));
  svg.addEventListener("contextmenu", (event) => openPolylineContextMenu(elements, result.payload, event, documentRef));
  elements.previewSurface.append(svg);
  elements.exportOutput.value = encodePayload(result.payload);
  elements.status.textContent = "Valid payload";
  elements.status.dataset.state = "valid";
  if (renderTools) {
    renderItemTools(elements, result.payload, documentRef);
  } else {
    highlightSelectedPreviewItem(elements);
  }
}

function getCurrentSnapshot(elements: EditorElements): EditorSnapshot {
  return {
    json: elements.jsonInput.value,
    selectedItemId: elements.selectedItemId,
    selectedItemIds: [...elements.selectedItemIds]
  };
}

function recordHistory(elements: EditorElements): void {
  const snapshot = getCurrentSnapshot(elements);
  const lastSnapshot = elements.undoStack[elements.undoStack.length - 1];

  if (lastSnapshot?.json === snapshot.json && lastSnapshot.selectedItemId === snapshot.selectedItemId) {
    return;
  }

  elements.undoStack.push(snapshot);

  if (elements.undoStack.length > 100) {
    elements.undoStack.shift();
  }

  elements.redoStack = [];
  updateHistoryControls(elements);
}

function undoEditorChange(elements: EditorElements, documentRef: Document): void {
  const snapshot = elements.undoStack.pop();

  if (!snapshot) {
    return;
  }

  elements.redoStack.push(getCurrentSnapshot(elements));
  applyEditorSnapshot(elements, snapshot, documentRef);
}

function redoEditorChange(elements: EditorElements, documentRef: Document): void {
  const snapshot = elements.redoStack.pop();

  if (!snapshot) {
    return;
  }

  elements.undoStack.push(getCurrentSnapshot(elements));
  applyEditorSnapshot(elements, snapshot, documentRef);
}

function applyEditorSnapshot(elements: EditorElements, snapshot: EditorSnapshot, documentRef: Document): void {
  elements.jsonInput.value = snapshot.json;
  setSelectedItems(elements, snapshot.selectedItemIds ?? (snapshot.selectedItemId ? [snapshot.selectedItemId] : []), snapshot.selectedItemId);
  delete elements.dragState;
  delete elements.pointDragState;
  delete elements.drawState;
  closePolylineContextMenu(elements);
  updateDrawControls(elements);
  updateFromJson(elements, documentRef);
  updateHistoryControls(elements);
}

function updateHistoryControls(elements: EditorElements): void {
  elements.undoButton.disabled = elements.undoStack.length === 0;
  elements.redoButton.disabled = elements.redoStack.length === 0;
}

function activateSelectTool(elements: EditorElements, documentRef: Document): void {
  if (elements.drawState) {
    cancelPolylineDrawing(elements, documentRef);
    return;
  }

  elements.panMode = false;
  updatePreviewModeControls(elements);
  updateDrawControls(elements);
}

function showEditorTab(elements: EditorElements, tab: EditorTabName): void {
  if (elements.dockedTab === tab) {
    undockEditorTab(elements, tab);
  }

  elements.activeTab = tab;
  updateEditorTabs(elements);

  if (tab === "json") {
    selectSelectedItemInJson(elements);
  }
}

function togglePreviewGrid(elements: EditorElements, documentRef: Document): void {
  elements.gridEnabled = !elements.gridEnabled;
  elements.toggleGridButton.setAttribute("aria-pressed", String(elements.gridEnabled));
  elements.toggleGridButton.textContent = elements.gridEnabled ? "Grid On" : "Grid Off";
  updateFromJson(elements, documentRef);
}

function toggleSnap(elements: EditorElements): void {
  elements.snapEnabled = !elements.snapEnabled;
  elements.toggleSnapButton.setAttribute("aria-pressed", String(elements.snapEnabled));
  elements.toggleSnapButton.textContent = elements.snapEnabled ? "Snap On" : "Snap Off";
}

function togglePanMode(elements: EditorElements): void {
  elements.panMode = !elements.panMode;
  updatePreviewModeControls(elements);
}

function zoomPreview(elements: EditorElements, scale: number, anchor?: SchematicPoint): void {
  const svg = getPreviewSvg(elements);

  if (!svg) {
    return;
  }

  const current = getCurrentPreviewViewBox(elements, svg);
  const nextWidth = current.width * scale;
  const nextHeight = current.height * scale;
  const centerX = anchor?.x ?? current.x + current.width / 2;
  const centerY = anchor?.y ?? current.y + current.height / 2;
  const anchorRatioX = (centerX - current.x) / current.width;
  const anchorRatioY = (centerY - current.y) / current.height;

  elements.previewViewBox = {
    x: centerX - nextWidth * anchorRatioX,
    y: centerY - nextHeight * anchorRatioY,
    width: nextWidth,
    height: nextHeight
  };
  setSvgViewBox(svg, elements.previewViewBox);
}

function handlePreviewWheel(elements: EditorElements, event: WheelEvent): void {
  const svg = event.currentTarget;

  if (!isSvgElement(svg, elements.editorRoot.ownerDocument)) {
    return;
  }

  event.preventDefault();
  const scale = event.deltaY < 0 ? 0.9 : 1.1;
  zoomPreview(elements, scale, getSvgPoint(getSvgCoordinateSpace(svg), event));
}

function updatePreviewModeControls(elements: EditorElements): void {
  elements.selectToolButton.setAttribute("aria-pressed", String(!elements.panMode));
  elements.panToolButton.setAttribute("aria-pressed", String(elements.panMode));
  elements.panToolButton.textContent = elements.panMode ? "✋" : "🤚";
  elements.previewSurface.dataset.panMode = String(elements.panMode);
}

function resetPreviewView(elements: EditorElements): void {
  const svg = getPreviewSvg(elements);

  delete elements.previewViewBox;

  if (!svg) {
    return;
  }

  const fallback = getSvgDefaultViewBox(svg);

  if (fallback) {
    setSvgViewBox(svg, fallback);
  }
}

function applyPreviewViewBox(elements: EditorElements, svg: SVGSVGElement, payload: SchematicPayload): void {
  const fallback = {
    x: 0,
    y: 0,
    width: payload.viewport.width,
    height: payload.viewport.height
  };
  const viewBox = elements.previewViewBox ?? fallback;
  setSvgViewBox(svg, viewBox);
}

function getPreviewSvg(elements: EditorElements): SVGSVGElement | undefined {
  const svg = elements.previewSurface.querySelector("svg");
  return svg && isSvgElement(svg, elements.editorRoot.ownerDocument) ? svg : undefined;
}

function getCurrentPreviewViewBox(elements: EditorElements, svg: SVGSVGElement): PreviewViewBox {
  return elements.previewViewBox ?? getSvgIntrinsicViewBox(svg) ?? {
    x: 0,
    y: 0,
    width: 1,
    height: 1
  };
}

function getSvgIntrinsicViewBox(svg: SVGSVGElement): PreviewViewBox | undefined {
  return parseViewBox(svg.getAttribute("viewBox"));
}

function getSvgDefaultViewBox(svg: SVGSVGElement): PreviewViewBox | undefined {
  const width = Number(svg.getAttribute("width"));
  const height = Number(svg.getAttribute("height"));

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return undefined;
  }

  return {
    x: 0,
    y: 0,
    width,
    height
  };
}

function setSvgViewBox(svg: SVGSVGElement, viewBox: PreviewViewBox): void {
  svg.setAttribute("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
}

function updateEditorTabs(elements: EditorElements): void {
  const tabs: EditorTabName[] = ["items", "inspector", "json"];
  const buttons = {
    items: elements.itemsTabButton,
    inspector: elements.inspectorTabButton,
    json: elements.jsonTabButton
  };
  const sections = {
    items: elements.itemListSection,
    inspector: elements.inspectorSection,
    json: elements.jsonSection
  };

  for (const tab of tabs) {
    const active = elements.activeTab === tab;
    const docked = elements.dockedTab === tab;
    buttons[tab].setAttribute("aria-selected", String(active));
    buttons[tab].dataset.docked = String(docked);
    sections[tab].hidden = !active && !docked;

    if (docked && sections[tab].parentElement !== elements.dockedPanel) {
      elements.dockedPanel.append(sections[tab]);
    } else if (!docked && sections[tab].parentElement !== elements.primaryPanel) {
      elements.primaryPanel.append(sections[tab]);
    }
  }

  elements.dockedPanel.hidden = elements.dockedTab === undefined;
  elements.dockedPanelTab.hidden = elements.dockedTab === undefined;
  elements.dockedPanelTab.textContent = elements.dockedTab ? getEditorTabLabel(elements.dockedTab) : "";
  elements.dockedPanelTab.dataset.editorTab = elements.dockedTab;
  elements.editorRoot.dataset.dockedTab = elements.dockedTab ?? "";
}

function setupEditorTabDocking(elements: EditorElements): void {
  for (const button of [elements.itemsTabButton, elements.inspectorTabButton, elements.jsonTabButton]) {
    button.draggable = true;
    button.addEventListener("dragstart", (event) => {
      elements.draggedTab = getTabNameFromButton(button);
      event.dataTransfer?.setData("text/plain", elements.draggedTab);
    });
    button.addEventListener("dragend", () => {
      delete elements.draggedTab;
      elements.tabDropZone.dataset.dropTarget = "false";
    });
  }

  elements.dockedPanelTab.draggable = true;
  elements.dockedPanelTab.addEventListener("dragstart", (event) => {
    if (!elements.dockedTab) {
      return;
    }

    elements.draggedTab = elements.dockedTab;
    event.dataTransfer?.setData("text/plain", elements.draggedTab);
  });
  elements.dockedPanelTab.addEventListener("dragend", () => {
    delete elements.draggedTab;
    elements.tabDropZone.dataset.dropTarget = "false";
  });

  elements.tabDropZone.addEventListener("dragover", (event) => {
    if (!elements.draggedTab || elements.draggedTab === elements.dockedTab) {
      return;
    }

    event.preventDefault();
    elements.tabDropZone.dataset.dropTarget = "true";
  });

  elements.tabDropZone.addEventListener("dragleave", () => {
    elements.tabDropZone.dataset.dropTarget = "false";
  });

  elements.tabDropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    const tab = elements.draggedTab;
    elements.tabDropZone.dataset.dropTarget = "false";

    if (!tab || tab === elements.dockedTab) {
      return;
    }

    dockEditorTab(elements, tab);
  });

  const tabRow = elements.itemsTabButton.parentElement;
  tabRow?.addEventListener("dragover", (event) => {
    if (elements.draggedTab && elements.draggedTab === elements.dockedTab) {
      event.preventDefault();
      tabRow.dataset.dropTarget = "true";
    }
  });
  tabRow?.addEventListener("dragleave", () => {
    tabRow.dataset.dropTarget = "false";
  });
  tabRow?.addEventListener("drop", (event) => {
    event.preventDefault();
    tabRow.dataset.dropTarget = "false";

    if (elements.draggedTab) {
      undockEditorTab(elements, elements.draggedTab);
    }
  });

  updateEditorTabs(elements);
}

function getTabNameFromButton(button: HTMLButtonElement): EditorTabName {
  return button.dataset.editorTab === "inspector" || button.dataset.editorTab === "json"
    ? button.dataset.editorTab
    : "items";
}

function getEditorTabLabel(tab: EditorTabName): string {
  switch (tab) {
    case "items":
      return "Items";
    case "inspector":
      return "Inspector";
    case "json":
      return "JSON";
  }
}

function dockEditorTab(elements: EditorElements, tab: EditorTabName): void {
  if (elements.dockedTab && elements.dockedTab !== tab) {
    undockEditorTab(elements, elements.dockedTab);
  }

  elements.dockedTab = tab;

  if (elements.activeTab === tab) {
    elements.activeTab = tab === "items" ? "inspector" : "items";
  }

  updateEditorTabs(elements);
}

function undockEditorTab(elements: EditorElements, tab: EditorTabName): void {
  if (elements.dockedTab !== tab) {
    return;
  }

  delete elements.dockedTab;
  elements.activeTab = tab;
  updateEditorTabs(elements);
}

function updateGridSize(elements: EditorElements, documentRef: Document): void {
  const nextGridSize = Number(elements.gridSizeInput.value);

  if (!Number.isFinite(nextGridSize) || nextGridSize <= 0) {
    elements.gridSizeInput.value = String(elements.gridSize);
    elements.gridSizeInput.setCustomValidity("Grid size must be a positive number");
    elements.gridSizeInput.reportValidity();
    return;
  }

  elements.gridSize = nextGridSize;
  elements.gridSizeInput.setCustomValidity("");
  updateFromJson(elements, documentRef);
}

function renderPreviewGrid(
  svg: SVGSVGElement,
  payload: SchematicPayload,
  gridEnabled: boolean,
  gridSize: number,
  documentRef: Document
): void {
  if (!gridEnabled) {
    return;
  }

  const grid = documentRef.createElementNS(SVG_NAMESPACE, "g");
  grid.classList.add("editor-grid-overlay");
  grid.setAttribute("data-editor-grid", "true");
  grid.setAttribute("data-grid-size", String(gridSize));
  grid.setAttribute("pointer-events", "none");

  for (let x = 0; x <= payload.viewport.width; x += gridSize) {
    const line = documentRef.createElementNS(SVG_NAMESPACE, "line");
    line.setAttribute("x1", String(x));
    line.setAttribute("y1", "0");
    line.setAttribute("x2", String(x));
    line.setAttribute("y2", String(payload.viewport.height));
    grid.append(line);
  }

  for (let y = 0; y <= payload.viewport.height; y += gridSize) {
    const line = documentRef.createElementNS(SVG_NAMESPACE, "line");
    line.setAttribute("x1", "0");
    line.setAttribute("y1", String(y));
    line.setAttribute("x2", String(payload.viewport.width));
    line.setAttribute("y2", String(y));
    grid.append(line);
  }

  svg.prepend(grid);
}

function renderPolylineRubberBand(
  svg: SVGSVGElement,
  drawState: PolylineDrawState | undefined,
  documentRef: Document
): void {
  if (!drawState || drawState.points.length === 0 || !drawState.previewPoint) {
    return;
  }

  const lastPoint = drawState.points[drawState.points.length - 1];
  const rubberBand = documentRef.createElementNS(SVG_NAMESPACE, "line");
  rubberBand.classList.add("editor-polyline-rubber-band");
  rubberBand.setAttribute("data-editor-rubber-band", "true");
  rubberBand.setAttribute("pointer-events", "none");
  rubberBand.setAttribute("x1", String(lastPoint.x));
  rubberBand.setAttribute("y1", String(lastPoint.y));
  rubberBand.setAttribute("x2", String(drawState.previewPoint.x));
  rubberBand.setAttribute("y2", String(drawState.previewPoint.y));
  svg.append(rubberBand);
}

function renderSelectionRectangle(
  svg: SVGSVGElement,
  state: SelectionRectState | undefined,
  documentRef: Document
): void {
  if (!state?.moved) {
    return;
  }

  const rect = getNormalizedRect(state.startPoint, state.currentPoint);
  const element = documentRef.createElementNS(SVG_NAMESPACE, "rect");
  element.classList.add("editor-selection-rectangle");
  element.setAttribute("data-editor-selection-rectangle", "true");
  element.setAttribute("pointer-events", "none");
  element.setAttribute("x", String(rect.x));
  element.setAttribute("y", String(rect.y));
  element.setAttribute("width", String(rect.width));
  element.setAttribute("height", String(rect.height));
  svg.append(element);
}

function updateSelectionRectangleElement(state: SelectionRectState, documentRef: Document): void {
  let element = state.svg.querySelector<SVGRectElement>("[data-editor-selection-rectangle]");
  const rect = getNormalizedRect(state.startPoint, state.currentPoint);

  if (!element) {
    element = documentRef.createElementNS(SVG_NAMESPACE, "rect");
    element.classList.add("editor-selection-rectangle");
    element.setAttribute("data-editor-selection-rectangle", "true");
    element.setAttribute("pointer-events", "none");
    state.svg.append(element);
  }

  element.setAttribute("x", String(rect.x));
  element.setAttribute("y", String(rect.y));
  element.setAttribute("width", String(rect.width));
  element.setAttribute("height", String(rect.height));
}

function getNormalizedRect(startPoint: SchematicPoint, currentPoint: SchematicPoint): PreviewViewBox {
  const x = Math.min(startPoint.x, currentPoint.x);
  const y = Math.min(startPoint.y, currentPoint.y);
  const width = Math.abs(currentPoint.x - startPoint.x);
  const height = Math.abs(currentPoint.y - startPoint.y);
  return { x, y, width, height };
}

function findItemsInSelectionRect(payload: SchematicPayload, selectionRect: PreviewViewBox): string[] {
  return payload.items
    .filter((item) => {
      const bounds = getItemBounds(item);
      return bounds ? rectsIntersect(selectionRect, bounds) : false;
    })
    .map((item) => item.id);
}

function getItemBounds(item: SchematicItem): PreviewViewBox | undefined {
  switch (item.type) {
    case "line":
      return getBoundsFromPoints([
        { x: item.x1, y: item.y1 },
        { x: item.x2, y: item.y2 }
      ]);
    case "polyline":
      return getBoundsFromPoints(item.points);
    case "rect":
      return { x: item.x, y: item.y, width: item.width, height: item.height };
    case "circle":
      return { x: item.cx - item.r, y: item.cy - item.r, width: item.r * 2, height: item.r * 2 };
    case "text":
    case "entityValue":
    case "symbol":
      return { x: item.x, y: item.y, width: 1, height: 1 };
    case "group":
      return getBoundsFromItems(item.children);
    case "path":
      return undefined;
  }
}

function getBoundsFromItems(items: SchematicItem[]): PreviewViewBox | undefined {
  return getBoundsFromRects(items.map(getItemBounds).filter((bounds): bounds is PreviewViewBox => bounds !== undefined));
}

function getBoundsFromPoints(points: SchematicPoint[]): PreviewViewBox | undefined {
  if (points.length === 0) {
    return undefined;
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function getBoundsFromRects(rects: PreviewViewBox[]): PreviewViewBox | undefined {
  if (rects.length === 0) {
    return undefined;
  }

  const minX = Math.min(...rects.map((rect) => rect.x));
  const minY = Math.min(...rects.map((rect) => rect.y));
  const maxX = Math.max(...rects.map((rect) => rect.x + rect.width));
  const maxY = Math.max(...rects.map((rect) => rect.y + rect.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function rectsIntersect(left: PreviewViewBox, right: PreviewViewBox): boolean {
  return left.x <= right.x + right.width
    && left.x + left.width >= right.x
    && left.y <= right.y + right.height
    && left.y + left.height >= right.y;
}

function renderPolylineHandles(
  svg: SVGSVGElement,
  payload: SchematicPayload,
  selectedItemId: string | undefined,
  drawState: PolylineDrawState | undefined,
  documentRef: Document
): void {
  if (drawState || !selectedItemId) {
    return;
  }

  const item = payload.items.find((candidate) => candidate.id === selectedItemId);

  if (!item || item.type !== "polyline") {
    return;
  }

  const handles = documentRef.createElementNS(SVG_NAMESPACE, "g");
  handles.classList.add("editor-polyline-handles");
  handles.setAttribute("data-editor-polyline-handles", "true");

  item.points.forEach((point, index) => {
    const hitbox = documentRef.createElementNS(SVG_NAMESPACE, "circle");
    hitbox.classList.add("editor-polyline-handle-hitbox");
    setPolylineHandleAttrs(hitbox, selectedItemId, index, point, 5);

    const dot = documentRef.createElementNS(SVG_NAMESPACE, "circle");
    dot.classList.add("editor-polyline-handle-dot");
    setPolylineHandleAttrs(dot, selectedItemId, index, point, 1.5);

    handles.append(hitbox, dot);
  });

  svg.append(handles);
}

function setPolylineHandleAttrs(
  handle: SVGCircleElement,
  itemId: string,
  pointIndex: number,
  point: SchematicPoint,
  radius: number
): void {
  handle.setAttribute("data-polyline-handle", itemId);
  handle.setAttribute("data-point-index", String(pointIndex));
  handle.setAttribute("cx", String(point.x));
  handle.setAttribute("cy", String(point.y));
  handle.setAttribute("r", String(radius));
}

function parseAndValidatePayload(value: string): { ok: true; payload: SchematicPayload } | { ok: false; message: string } {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch (error) {
    return {
      ok: false,
      message: `JSON error: ${error instanceof Error ? error.message : String(error)}`
    };
  }

  const validation = validateSchematicPayload(parsed);

  if (!validation.valid) {
    return {
      ok: false,
      message: `Schema error:\n${validation.errors.map((validationError) => `- ${validationError}`).join("\n")}`
    };
  }

  if (!isSchematicPayload(parsed)) {
    return {
      ok: false,
      message: "Schema error:\n- Payload did not match schema"
    };
  }

  return {
    ok: true,
    payload: parsed
  };
}

function formatCurrentJson(elements: EditorElements, documentRef: Document): void {
  const result = parseAndValidatePayload(elements.jsonInput.value);

  if (!result.ok) {
    elements.previewSurface.replaceChildren();
    elements.exportOutput.value = "";
    elements.status.textContent = result.message;
    elements.status.dataset.state = "error";
    return;
  }

  const formattedJson = formatPayloadJson(result.payload);

  if (elements.jsonInput.value !== formattedJson) {
    recordHistory(elements);
  }

  elements.jsonInput.value = formattedJson;
  updateFromJson(elements, documentRef);
}

function resetDemoPayload(elements: EditorElements, documentRef: Document): void {
  if (elements.jsonInput.value !== formatPayloadJson() || elements.selectedItemId !== undefined) {
    recordHistory(elements);
  }

  setSelectedItems(elements, []);
  elements.jsonInput.value = formatPayloadJson();
  updateFromJson(elements, documentRef);
}

function renderDisabledItemTools(elements: EditorElements, message: string): void {
  elements.itemList.replaceChildren();
  elements.symbolSummary.replaceChildren();
  elements.symbolSummary.hidden = true;
  elements.inspector.replaceChildren();
  updateSelectedItemActionButtons(elements, false);
  elements.inspectorStatus.textContent = `Inspector unavailable:\n${message}`;
  elements.inspectorStatus.dataset.state = "error";
}

function addItem(elements: EditorElements, type: AddItemType, documentRef: Document, point?: SchematicPoint): void {
  const result = parseAndValidatePayload(elements.jsonInput.value);

  if (!result.ok) {
    renderDisabledItemTools(elements, result.message);
    return;
  }

  const item = createDefaultItem(result.payload, type, point);
  recordHistory(elements);
  result.payload.items.push(item);
  setSelectedItems(elements, [item.id]);
  elements.jsonInput.value = formatPayloadJson(result.payload);
  updateFromJson(elements, documentRef);
  showEditorTab(elements, "inspector");
}

function createDefaultItem(payload: SchematicPayload, type: AddItemType, point?: SchematicPoint): SchematicItem {
  const centerX = Math.round(point?.x ?? payload.viewport.width / 2);
  const centerY = Math.round(point?.y ?? payload.viewport.height / 2);
  const id = createUniqueItemId(payload, type);

  switch (type) {
    case "text":
      return {
        id,
        type: "text",
        layer: 600,
        x: centerX,
        y: centerY,
        text: "New text",
        style: {
          fill: "var(--primary-text-color)",
          fontSize: 14,
          textAnchor: "middle"
        }
      };
    case "rect":
      return {
        id,
        type: "rect",
        layer: 300,
        x: centerX - 32,
        y: centerY - 20,
        width: 64,
        height: 40,
        rx: 4,
        ry: 4,
        style: {
          stroke: "var(--primary-text-color)",
          strokeWidth: 2,
          fill: "var(--divider-color)"
        }
      };
    case "circle":
      return {
        id,
        type: "circle",
        layer: 300,
        cx: centerX,
        cy: centerY,
        r: 18,
        style: {
          stroke: "var(--primary-text-color)",
          strokeWidth: 2,
          fill: "var(--divider-color)"
        }
      };
    case "polyline":
      return {
        id,
        type: "polyline",
        layer: 100,
        points: [
          { x: centerX, y: centerY },
          { x: centerX + 60, y: centerY }
        ],
        style: {
          stroke: "var(--accent-color)",
          strokeWidth: 4,
          fill: "none"
        }
      };
  }
}

function addItemFromContextMenu(elements: EditorElements, type: AddItemType, documentRef: Document): void {
  const point = elements.contextMenuState?.point;

  if (!point) {
    elements.inspectorStatus.textContent = "No preview point selected";
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  addItem(elements, type, documentRef, point);
  closePolylineContextMenu(elements);
}

function createUniqueItemId(payload: SchematicPayload, type: string): string {
  const existingIds = new Set(payload.items.map((item) => item.id));
  let index = 1;

  while (existingIds.has(`${type}-${index}`)) {
    index += 1;
  }

  return `${type}-${index}`;
}

function createUniqueDuplicateItemId(payload: SchematicPayload, sourceId: string): string {
  return createUniqueDuplicateItemIdFromSet(new Set(payload.items.map((item) => item.id)), sourceId);
}

function createUniqueDuplicateItemIdFromSet(existingIds: Set<string>, sourceId: string): string {
  const baseId = `${sourceId}-copy`;

  if (!existingIds.has(baseId)) {
    existingIds.add(baseId);
    return baseId;
  }

  let index = 2;

  while (existingIds.has(`${baseId}-${index}`)) {
    index += 1;
  }

  const id = `${baseId}-${index}`;
  existingIds.add(id);
  return id;
}

function duplicateSelectedItem(elements: EditorElements, documentRef: Document): void {
  const result = parseAndValidatePayload(elements.jsonInput.value);

  if (!result.ok) {
    renderDisabledItemTools(elements, result.message);
    return;
  }

  const selectedIds = getSelectedItemIds(elements, result.payload);

  if (selectedIds.length === 0) {
    elements.inspectorStatus.textContent = "Selected item was not found";
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  const selectedIdSet = new Set(selectedIds);
  const existingIds = new Set(result.payload.items.map((item) => item.id));
  const duplicateIds: string[] = [];
  const nextItems: SchematicItem[] = [];
  recordHistory(elements);

  for (const item of result.payload.items) {
    nextItems.push(item);

    if (!selectedIdSet.has(item.id)) {
      continue;
    }

    const duplicate = cloneItem(item);
    duplicate.id = createUniqueDuplicateItemIdFromSet(existingIds, item.id);
    moveItem(duplicate, 10, 10);
    duplicateIds.push(duplicate.id);
    nextItems.push(duplicate);
  }

  result.payload.items = nextItems;
  setSelectedItems(elements, duplicateIds);
  elements.jsonInput.value = formatPayloadJson(result.payload);
  updateFromJson(elements, documentRef);
  showEditorTab(elements, "inspector");
  elements.inspectorStatus.textContent = duplicateIds.length === 1
    ? `Duplicated ${selectedIds[0]}`
    : `Duplicated ${duplicateIds.length} items`;
  elements.inspectorStatus.dataset.state = "valid";
}

function deleteSelectedItem(elements: EditorElements, documentRef: Document): void {
  const result = parseAndValidatePayload(elements.jsonInput.value);

  if (!result.ok) {
    renderDisabledItemTools(elements, result.message);
    return;
  }

  const selectedIds = getSelectedItemIds(elements, result.payload);

  if (selectedIds.length === 0) {
    elements.inspectorStatus.textContent = "Selected item was not found";
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  const selectedIdSet = new Set(selectedIds);
  const firstSelectedIndex = result.payload.items.findIndex((item) => selectedIdSet.has(item.id));
  recordHistory(elements);
  result.payload.items = result.payload.items.filter((item) => !selectedIdSet.has(item.id));
  setSelectedItems(elements, [
    result.payload.items[firstSelectedIndex]?.id ?? result.payload.items[firstSelectedIndex - 1]?.id
  ].filter(Boolean) as string[]);
  elements.jsonInput.value = formatPayloadJson(result.payload);
  updateFromJson(elements, documentRef);
  elements.inspectorStatus.textContent = selectedIds.length === 1
    ? `Deleted ${selectedIds[0]}`
    : `Deleted ${selectedIds.length} items`;
  elements.inspectorStatus.dataset.state = "valid";
}

function duplicateSelectedItemFromContextMenu(elements: EditorElements, documentRef: Document): void {
  duplicateSelectedItem(elements, documentRef);
  closePolylineContextMenu(elements);
}

function deleteSelectedItemFromContextMenu(elements: EditorElements, documentRef: Document): void {
  deleteSelectedItem(elements, documentRef);
  closePolylineContextMenu(elements);
}

function renderItemTools(elements: EditorElements, payload: SchematicPayload, documentRef: Document): void {
  elements.itemList.replaceChildren();
  renderSymbolSummary(elements, payload, documentRef);
  normalizeSelection(elements, payload);

  if (payload.items.length === 0) {
    setSelectedItems(elements, []);
    renderNeutralInspector(elements, "No top-level items");
    return;
  }

  const selectedItem = payload.items.find((item) => item.id === elements.selectedItemId);
  updateSelectedItemActionButtons(elements, selectedItem !== undefined);

  for (const item of payload.items) {
    const button = documentRef.createElement("button");
    button.className = "item-list-button";
    button.type = "button";
    button.dataset.itemId = item.id;
    button.textContent = `${item.id} (${item.type})`;
    button.setAttribute("aria-pressed", String(elements.selectedItemIds.includes(item.id)));
    button.addEventListener("click", () => {
      setSelectedItems(elements, [item.id]);
      updateFromJson(elements, documentRef);
      showEditorTab(elements, "inspector");
    });
    elements.itemList.append(button);
  }

  if (elements.selectedItemIds.length > 1) {
    renderMultiSelectInspector(elements, elements.selectedItemIds.length);
  } else if (selectedItem) {
    renderInspector(elements, selectedItem, payload, documentRef);
  } else {
    renderNeutralInspector(elements, "Select an item");
  }

  highlightSelectedPreviewItem(elements);
}

function renderSymbolSummary(elements: EditorElements, payload: SchematicPayload, documentRef: Document): void {
  elements.symbolSummary.replaceChildren();

  if (!payload.symbols || payload.symbols.length === 0) {
    elements.symbolSummary.hidden = true;
    return;
  }

  elements.symbolSummary.hidden = false;

  const heading = documentRef.createElement("div");
  heading.className = "symbol-summary-heading";
  heading.textContent = "Symbols";
  elements.symbolSummary.append(heading);

  for (const symbol of payload.symbols) {
    const row = documentRef.createElement("div");
    row.className = "symbol-summary-row";

    const title = documentRef.createElement("div");
    title.className = "symbol-summary-title";
    title.textContent = symbol.id;

    const metadata = documentRef.createElement("div");
    metadata.className = "symbol-summary-metadata";
    const parts = symbol.parts?.map((part) => part.id).join(", ") || "none";
    const slots = symbol.entitySlots?.map((slot) => slot.id).join(", ") || "none";
    metadata.textContent = `Parts: ${parts} | Slots: ${slots}`;

    row.append(title, metadata);
    elements.symbolSummary.append(row);
  }
}

function updateSelectedItemActionButtons(elements: EditorElements, hasSelection: boolean): void {
  elements.duplicateItemButton.disabled = !hasSelection;
  elements.deleteItemButton.disabled = !hasSelection;
}

function renderMultiSelectInspector(elements: EditorElements, count: number): void {
  elements.inspector.replaceChildren();
  updateSelectedItemActionButtons(elements, true);
  elements.inspectorStatus.textContent = `${count} items selected`;
  elements.inspectorStatus.dataset.state = "neutral";
}

function normalizeSelection(elements: EditorElements, payload: SchematicPayload): void {
  const validIds = new Set(payload.items.map((item) => item.id));
  const selectedIds = elements.selectedItemIds.filter((itemId, index, ids) => (
    validIds.has(itemId) && ids.indexOf(itemId) === index
  ));

  if (elements.selectedItemId && validIds.has(elements.selectedItemId) && !selectedIds.includes(elements.selectedItemId)) {
    selectedIds.push(elements.selectedItemId);
  }

  elements.selectedItemIds = selectedIds;
  elements.selectedItemId = elements.selectedItemId && selectedIds.includes(elements.selectedItemId)
    ? elements.selectedItemId
    : selectedIds[0];
}

function setSelectedItems(elements: EditorElements, itemIds: string[], primaryItemId?: string): void {
  elements.selectedItemIds = itemIds.filter((itemId, index, ids) => ids.indexOf(itemId) === index);
  elements.selectedItemId = primaryItemId && elements.selectedItemIds.includes(primaryItemId)
    ? primaryItemId
    : elements.selectedItemIds[0];
}

function toggleSelectedItem(elements: EditorElements, itemId: string): void {
  if (elements.selectedItemIds.includes(itemId)) {
    const nextIds = elements.selectedItemIds.filter((selectedItemId) => selectedItemId !== itemId);
    setSelectedItems(elements, nextIds);
    return;
  }

  setSelectedItems(elements, [...elements.selectedItemIds, itemId], itemId);
}

function getSelectedItemIds(elements: EditorElements, payload: SchematicPayload): string[] {
  const validIds = new Set(payload.items.map((item) => item.id));
  return elements.selectedItemIds.filter((itemId) => validIds.has(itemId));
}

function selectPreviewItem(
  elements: EditorElements,
  payload: SchematicPayload,
  event: MouseEvent,
  documentRef: Document
): void {
  const itemId = findSelectablePreviewItemId(elements, payload, event.target);

  if (!itemId) {
    clearSelection(elements, payload, documentRef);
    return;
  }

  if (event.ctrlKey || event.metaKey) {
    toggleSelectedItem(elements, itemId);
  } else {
    setSelectedItems(elements, [itemId]);
  }

  updateFromJson(elements, documentRef);

  if (isJsonVisible(elements)) {
    selectSelectedItemInJson(elements);
  }
}

function clearSelection(elements: EditorElements, payload: SchematicPayload, documentRef: Document): void {
  if (!elements.selectedItemId && elements.selectedItemIds.length === 0) {
    renderItemTools(elements, payload, documentRef);
    return;
  }

  setSelectedItems(elements, []);
  updateFromJson(elements, documentRef);
  clearJsonSelection(elements);
}

function isJsonVisible(elements: EditorElements): boolean {
  return elements.activeTab === "json" || elements.dockedTab === "json";
}

function handlePreviewClick(
  elements: EditorElements,
  payload: SchematicPayload,
  event: MouseEvent,
  documentRef: Document
): void {
  if (elements.panState?.moved) {
    delete elements.panState;
    return;
  }

  if (elements.selectionRectClickSuppressionPoint) {
    const point = elements.selectionRectClickSuppressionPoint;
    delete elements.selectionRectClickSuppressionPoint;

    if (Math.abs(event.clientX - point.clientX) <= 3 && Math.abs(event.clientY - point.clientY) <= 3) {
      return;
    }
  }

  if (elements.drawState) {
    addPolylinePointFromEvent(elements, payload, event, documentRef);
    return;
  }

  selectPreviewItem(elements, payload, event, documentRef);
}

function findSelectablePreviewItemId(
  elements: EditorElements,
  payload: SchematicPayload,
  target: EventTarget | null
): string | undefined {
  if (!(target instanceof Element)) {
    return undefined;
  }

  const topLevelIds = new Set(payload.items.map((item) => item.id));
  let current: Element | null = target;

  while (current && current !== elements.previewSurface) {
    const itemId = current.getAttribute("data-id");

    if (itemId && topLevelIds.has(itemId)) {
      return itemId;
    }

    current = current.parentElement;
  }

  return undefined;
}

function openPolylineContextMenu(
  elements: EditorElements,
  payload: SchematicPayload,
  event: MouseEvent,
  documentRef: Document
): void {
  if (elements.drawState) {
    return;
  }

  const svg = event.currentTarget;
  const handleTarget = getPolylineHandleTarget(event.target);
  const itemId = handleTarget?.getAttribute("data-polyline-handle")
    ?? findSelectablePreviewItemId(elements, payload, event.target);
  const item = itemId ? payload.items.find((candidate) => candidate.id === itemId) : undefined;

  if (!isSvgElement(svg, documentRef)) {
    closePolylineContextMenu(elements);
    return;
  }

  event.preventDefault();
  const point = snapPointIfNeeded(elements, getSvgPoint(getSvgCoordinateSpace(svg), event));

  if (!item) {
    elements.contextMenuState = { point };
    showContextMenu(elements, event, "empty");
    renderItemTools(elements, payload, documentRef);
    return;
  }

  if (!elements.selectedItemIds.includes(item.id)) {
    setSelectedItems(elements, [item.id]);
  } else {
    setSelectedItems(elements, elements.selectedItemIds, item.id);
  }

  elements.contextMenuState = {
    itemId: item.id,
    point
  };

  if (item.type === "polyline") {
    const insertIndex = findNearestSegmentInsertIndex(item.points, point);
    const handlePointIndex = handleTarget ? Number(handleTarget.getAttribute("data-point-index")) : undefined;
    const nearestPointIndex = typeof handlePointIndex === "number" && Number.isInteger(handlePointIndex)
      ? handlePointIndex
      : findNearestPointIndex(item.points, point);

    elements.contextMenuState = {
      itemId: item.id,
      insertIndex,
      nearestPointIndex,
      point
    };
  }

  showContextMenu(elements, event, item.type === "polyline" ? "polyline" : "item");
  elements.deletePolylinePointButton.disabled = item.type !== "polyline" || item.points.length <= 2;
  renderItemTools(elements, payload, documentRef);
}

function showContextMenu(
  elements: EditorElements,
  event: MouseEvent,
  mode: "empty" | "item" | "polyline"
): void {
  elements.polylineContextMenu.hidden = false;
  elements.polylineContextMenu.dataset.mode = mode;
  elements.polylineContextMenu.style.left = `${event.clientX}px`;
  elements.polylineContextMenu.style.top = `${event.clientY}px`;
}

function addPolylinePointFromContextMenu(elements: EditorElements, documentRef: Document): void {
  const state = elements.contextMenuState;

  if (!state) {
    return;
  }

  if (state.insertIndex === undefined || !state.point) {
    elements.inspectorStatus.textContent = "No polyline point target selected";
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  const result = parseAndValidatePayload(elements.jsonInput.value);

  if (!result.ok) {
    renderDisabledItemTools(elements, result.message);
    return;
  }

  const item = state.itemId
    ? result.payload.items.find((candidate) => candidate.id === state.itemId)
    : undefined;

  if (!item || item.type !== "polyline") {
    elements.inspectorStatus.textContent = "Selected polyline was not found";
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  recordHistory(elements);
  item.points.splice(state.insertIndex, 0, state.point);
  setSelectedItems(elements, [item.id]);
  elements.jsonInput.value = formatPayloadJson(result.payload);
  closePolylineContextMenu(elements);
  updateFromJson(elements, documentRef);
  elements.inspectorStatus.textContent = `Added point to ${item.id}`;
  elements.inspectorStatus.dataset.state = "valid";
}

function deletePolylinePointFromContextMenu(elements: EditorElements, documentRef: Document): void {
  const state = elements.contextMenuState;

  if (!state) {
    return;
  }

  if (state.nearestPointIndex === undefined) {
    elements.inspectorStatus.textContent = "No polyline point target selected";
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  const result = parseAndValidatePayload(elements.jsonInput.value);

  if (!result.ok) {
    renderDisabledItemTools(elements, result.message);
    return;
  }

  const item = state.itemId
    ? result.payload.items.find((candidate) => candidate.id === state.itemId)
    : undefined;

  if (!item || item.type !== "polyline") {
    elements.inspectorStatus.textContent = "Selected polyline was not found";
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  if (item.points.length <= 2) {
    elements.inspectorStatus.textContent = "Polyline needs at least two points";
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  recordHistory(elements);
  item.points.splice(state.nearestPointIndex, 1);
  setSelectedItems(elements, [item.id]);
  elements.jsonInput.value = formatPayloadJson(result.payload);
  closePolylineContextMenu(elements);
  updateFromJson(elements, documentRef);
  elements.inspectorStatus.textContent = `Deleted point from ${item.id}`;
  elements.inspectorStatus.dataset.state = "valid";
}

function changeSelectedItemLayer(elements: EditorElements, action: LayerAction, documentRef: Document): void {
  const state = elements.contextMenuState;

  if (!state) {
    return;
  }

  const result = parseAndValidatePayload(elements.jsonInput.value);

  if (!result.ok) {
    renderDisabledItemTools(elements, result.message);
    return;
  }

  const item = state.itemId
    ? result.payload.items.find((candidate) => candidate.id === state.itemId)
    : undefined;

  if (!item) {
    elements.inspectorStatus.textContent = "Selected item was not found";
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  const nextLayer = getNextLayerForAction(result.payload.items, item, action);

  if (nextLayer === item.layer) {
    closePolylineContextMenu(elements);
    elements.inspectorStatus.textContent = `${item.id} is already at that layer edge`;
    elements.inspectorStatus.dataset.state = "valid";
    return;
  }

  recordHistory(elements);
  item.layer = nextLayer;
  setSelectedItems(elements, [item.id]);
  elements.jsonInput.value = formatPayloadJson(result.payload);
  closePolylineContextMenu(elements);
  updateFromJson(elements, documentRef);
  elements.inspectorStatus.textContent = `Updated layer for ${item.id}`;
  elements.inspectorStatus.dataset.state = "valid";
}

function alignSelectedItems(elements: EditorElements, action: AlignAction, documentRef: Document): void {
  const result = parseAndValidatePayload(elements.jsonInput.value);

  if (!result.ok) {
    renderDisabledItemTools(elements, result.message);
    return;
  }

  const selectedItems = getMovableSelectedItems(elements, result.payload);

  if (selectedItems.length < 2) {
    elements.inspectorStatus.textContent = "Select at least two movable items to align";
    elements.inspectorStatus.dataset.state = "error";
    closePolylineContextMenu(elements);
    return;
  }

  const selectedBounds = selectedItems
    .map((item) => ({ item, bounds: getItemBounds(item) }))
    .filter((entry): entry is { item: SchematicItem; bounds: PreviewViewBox } => entry.bounds !== undefined);
  const groupBounds = getBoundsFromRects(selectedBounds.map((entry) => entry.bounds));

  if (!groupBounds) {
    elements.inspectorStatus.textContent = "Selected items cannot be aligned yet";
    elements.inspectorStatus.dataset.state = "error";
    closePolylineContextMenu(elements);
    return;
  }

  recordHistory(elements);

  for (const { item, bounds } of selectedBounds) {
    const dx = getAlignDeltaX(action, bounds, groupBounds);
    const dy = getAlignDeltaY(action, bounds, groupBounds);
    moveItem(item, dx, dy);
  }

  elements.jsonInput.value = formatPayloadJson(result.payload);
  closePolylineContextMenu(elements);
  updateFromJson(elements, documentRef);
  elements.inspectorStatus.textContent = `Aligned ${selectedBounds.length} items`;
  elements.inspectorStatus.dataset.state = "valid";
}

function mirrorSelectedItems(elements: EditorElements, action: MirrorAction, documentRef: Document): void {
  const result = parseAndValidatePayload(elements.jsonInput.value);

  if (!result.ok) {
    renderDisabledItemTools(elements, result.message);
    return;
  }

  const selectedItems = getMovableSelectedItems(elements, result.payload);

  if (selectedItems.length < 2) {
    elements.inspectorStatus.textContent = "Select at least two movable items to mirror";
    elements.inspectorStatus.dataset.state = "error";
    closePolylineContextMenu(elements);
    return;
  }

  const selectedBounds = selectedItems
    .map((item) => ({ item, bounds: getItemBounds(item) }))
    .filter((entry): entry is { item: SchematicItem; bounds: PreviewViewBox } => entry.bounds !== undefined);
  const groupBounds = getBoundsFromRects(selectedBounds.map((entry) => entry.bounds));

  if (!groupBounds) {
    elements.inspectorStatus.textContent = "Selected items cannot be mirrored yet";
    elements.inspectorStatus.dataset.state = "error";
    closePolylineContextMenu(elements);
    return;
  }

  const axis = action === "horizontal"
    ? groupBounds.x + groupBounds.width / 2
    : groupBounds.y + groupBounds.height / 2;

  recordHistory(elements);

  for (const { item, bounds } of selectedBounds) {
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    moveItem(item, action === "horizontal" ? 2 * (axis - centerX) : 0, action === "vertical" ? 2 * (axis - centerY) : 0);
  }

  elements.jsonInput.value = formatPayloadJson(result.payload);
  closePolylineContextMenu(elements);
  updateFromJson(elements, documentRef);
  elements.inspectorStatus.textContent = `Mirrored ${selectedBounds.length} items`;
  elements.inspectorStatus.dataset.state = "valid";
}

function getMovableSelectedItems(elements: EditorElements, payload: SchematicPayload): SchematicItem[] {
  const selectedIds = new Set(getSelectedItemIds(elements, payload));
  return payload.items.filter((item) => selectedIds.has(item.id) && canMoveItem(item));
}

function getAlignDeltaX(action: AlignAction, bounds: PreviewViewBox, groupBounds: PreviewViewBox): number {
  switch (action) {
    case "left":
      return groupBounds.x - bounds.x;
    case "right":
      return groupBounds.x + groupBounds.width - (bounds.x + bounds.width);
    case "center":
      return groupBounds.x + groupBounds.width / 2 - (bounds.x + bounds.width / 2);
    case "top":
    case "bottom":
      return 0;
  }
}

function getAlignDeltaY(action: AlignAction, bounds: PreviewViewBox, groupBounds: PreviewViewBox): number {
  switch (action) {
    case "top":
      return groupBounds.y - bounds.y;
    case "bottom":
      return groupBounds.y + groupBounds.height - (bounds.y + bounds.height);
    case "center":
      return groupBounds.y + groupBounds.height / 2 - (bounds.y + bounds.height / 2);
    case "left":
    case "right":
      return 0;
  }
}

function getNextLayerForAction(items: SchematicItem[], item: SchematicItem, action: LayerAction): number {
  const otherLayers = items
    .filter((candidate) => candidate.id !== item.id)
    .map((candidate) => candidate.layer)
    .filter((layer) => Number.isFinite(layer));

  if (otherLayers.length === 0) {
    return item.layer;
  }

  switch (action) {
    case "forward": {
      const nextHigherLayer = Math.min(...otherLayers.filter((layer) => layer > item.layer));
      return Number.isFinite(nextHigherLayer) ? nextHigherLayer + 1 : item.layer;
    }
    case "backward": {
      const nextLowerLayer = Math.max(...otherLayers.filter((layer) => layer < item.layer));
      return Number.isFinite(nextLowerLayer) ? nextLowerLayer - 1 : item.layer;
    }
    case "front":
      return Math.max(...otherLayers, item.layer) + 1;
    case "back":
      return Math.min(...otherLayers, item.layer) - 1;
  }
}

function closePolylineContextMenu(elements: EditorElements): void {
  elements.polylineContextMenu.hidden = true;
  delete elements.polylineContextMenu.dataset.mode;
  delete elements.contextMenuState;
}

function findNearestSegmentInsertIndex(points: SchematicPoint[], point: SchematicPoint): number {
  if (points.length < 2) {
    return points.length;
  }

  let nearestIndex = 1;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < points.length - 1; index += 1) {
    const distance = distanceToSegment(point, points[index], points[index + 1]);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index + 1;
    }
  }

  return nearestIndex;
}

function findNearestPointIndex(points: SchematicPoint[], point: SchematicPoint): number {
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  points.forEach((candidate, index) => {
    const distance = squaredDistance(point, candidate);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return nearestIndex;
}

function distanceToSegment(point: SchematicPoint, start: SchematicPoint, end: SchematicPoint): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return squaredDistance(point, start);
  }

  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  return squaredDistance(point, {
    x: start.x + t * dx,
    y: start.y + t * dy
  });
}

function squaredDistance(left: SchematicPoint, right: SchematicPoint): number {
  const dx = left.x - right.x;
  const dy = left.y - right.y;
  return dx * dx + dy * dy;
}

function startPolylineDrawing(elements: EditorElements, documentRef: Document): void {
  if (elements.drawState) {
    cancelPolylineDrawing(elements, documentRef);
    return;
  }

  const result = parseAndValidatePayload(elements.jsonInput.value);

  if (!result.ok) {
    renderDisabledItemTools(elements, result.message);
    return;
  }

  const itemId = createUniqueItemId(result.payload, "polyline");
  elements.drawState = {
    itemId,
    points: []
  };
  elements.panMode = false;
  setSelectedItems(elements, [itemId]);
  showEditorTab(elements, "inspector");
  updatePreviewModeControls(elements);
  updateDrawControls(elements);
  updateFromJson(elements, documentRef);
  elements.inspectorStatus.textContent = "Click preview points. Enter or Finish to save, Escape to cancel.";
  elements.inspectorStatus.dataset.state = "valid";
}

function addPolylinePointFromEvent(
  elements: EditorElements,
  payload: SchematicPayload,
  event: MouseEvent,
  documentRef: Document
): void {
  const svg = event.currentTarget;

  if (!elements.drawState || !isSvgElement(svg, documentRef)) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (elements.drawState) {
    elements.drawState.shiftKey = event.shiftKey;
  }

  const point = resolveDrawPoint(elements, getSvgPoint(getSvgCoordinateSpace(svg), event));
  const result = parseAndValidatePayload(elements.jsonInput.value);

  if (!result.ok) {
    renderDisabledItemTools(elements, result.message);
    return;
  }

  if (elements.drawState.points.length === 0) {
    recordHistory(elements);
  }

  elements.drawState.points.push(point);
  elements.drawState.previewPoint = undefined;
  upsertDraftPolyline(result.payload, elements.drawState);
  setSelectedItems(elements, [elements.drawState.itemId]);
  elements.jsonInput.value = formatPayloadJson(result.payload);
  updateFromJson(elements, documentRef);
  elements.inspectorStatus.textContent = `Drawing ${elements.drawState.itemId}: ${elements.drawState.points.length} point(s)`;
  elements.inspectorStatus.dataset.state = "valid";
}

function updatePolylineRubberBand(elements: EditorElements, event: MouseEvent, documentRef: Document): void {
  const svg = event.currentTarget;

  if (!elements.drawState || elements.drawState.points.length === 0 || !isSvgElement(svg, documentRef)) {
    return;
  }

  elements.drawState.shiftKey = event.shiftKey;
  elements.drawState.previewPoint = resolveDrawPoint(elements, getSvgPoint(getSvgCoordinateSpace(svg), event));
  updatePolylineRubberBandElement(svg, elements.drawState, documentRef);
}

function updatePolylineRubberBandElement(
  svg: SVGSVGElement,
  drawState: PolylineDrawState,
  documentRef: Document
): void {
  let rubberBand = svg.querySelector<SVGLineElement>("[data-editor-rubber-band]");

  if (!rubberBand) {
    rubberBand = documentRef.createElementNS(SVG_NAMESPACE, "line");
    rubberBand.classList.add("editor-polyline-rubber-band");
    rubberBand.setAttribute("data-editor-rubber-band", "true");
    rubberBand.setAttribute("pointer-events", "none");
    svg.append(rubberBand);
  }

  const lastPoint = drawState.points[drawState.points.length - 1];
  const previewPoint = drawState.previewPoint;

  if (!previewPoint) {
    rubberBand.remove();
    return;
  }

  rubberBand.setAttribute("x1", String(lastPoint.x));
  rubberBand.setAttribute("y1", String(lastPoint.y));
  rubberBand.setAttribute("x2", String(previewPoint.x));
  rubberBand.setAttribute("y2", String(previewPoint.y));
}

function finishPolylineDrawing(elements: EditorElements, documentRef: Document): void {
  if (!elements.drawState) {
    return;
  }

  if (elements.drawState.points.length < 2) {
    elements.inspectorStatus.textContent = "Polyline needs at least two points";
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  const itemId = elements.drawState.itemId;
  setSelectedItems(elements, [itemId]);
  delete elements.drawState;
  updateDrawControls(elements);
  updateFromJson(elements, documentRef);
  elements.inspectorStatus.textContent = `Finished ${itemId}`;
  elements.inspectorStatus.dataset.state = "valid";
}

function cancelPolylineDrawing(elements: EditorElements, documentRef: Document): void {
  const drawState = elements.drawState;

  if (!drawState) {
    return;
  }

  const result = parseAndValidatePayload(elements.jsonInput.value);
  delete elements.drawState;
  updateDrawControls(elements);

  if (!result.ok) {
    renderDisabledItemTools(elements, result.message);
    return;
  }

  result.payload.items = result.payload.items.filter((item) => item.id !== drawState.itemId);
  setSelectedItems(elements, [result.payload.items[0]?.id].filter(Boolean) as string[]);
  elements.jsonInput.value = formatPayloadJson(result.payload);
  updateFromJson(elements, documentRef);
  elements.inspectorStatus.textContent = "Polyline drawing cancelled";
  elements.inspectorStatus.dataset.state = "valid";
}

function upsertDraftPolyline(payload: SchematicPayload, drawState: PolylineDrawState): void {
  const existingItem = payload.items.find((item) => item.id === drawState.itemId);
  const polyline: SchematicItem = {
    id: drawState.itemId,
    type: "polyline",
    layer: 100,
    points: drawState.points,
    style: {
      stroke: "var(--accent-color)",
      strokeWidth: 4,
      fill: "none"
    }
  };

  if (existingItem) {
    Object.assign(existingItem, polyline);
    return;
  }

  payload.items.push(polyline);
}

function updateDrawControls(elements: EditorElements): void {
  const drawing = elements.drawState !== undefined;
  elements.selectToolButton.setAttribute("aria-pressed", String(!drawing));
  elements.drawPolylineButton.textContent = drawing ? "Cancel Polyline" : "Draw Polyline";
  elements.drawPolylineButton.setAttribute("aria-pressed", String(drawing));
  elements.finishPolylineButton.hidden = !drawing;
  elements.previewSurface.dataset.drawMode = drawing ? "polyline" : "";

  if (!drawing) {
    delete elements.previewSurface.dataset.drawMode;
  }
}

function snapPointIfNeeded(elements: EditorElements, point: SchematicPoint): SchematicPoint {
  if (!elements.snapEnabled) {
    return point;
  }

  return {
    x: snapNumber(point.x, elements.gridSize),
    y: snapNumber(point.y, elements.gridSize)
  };
}

function resolveDrawPoint(elements: EditorElements, point: SchematicPoint): SchematicPoint {
  const snappedPoint = snapPointIfNeeded(elements, point);

  if (!elements.drawState?.shiftKey || elements.drawState.points.length === 0) {
    return snappedPoint;
  }

  return snapPointIfNeeded(elements, lockPointOrthogonally(
    elements.drawState.points[elements.drawState.points.length - 1],
    snappedPoint
  ));
}

function lockPointOrthogonally(origin: SchematicPoint, point: SchematicPoint): SchematicPoint {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return {
      x: point.x,
      y: origin.y
    };
  }

  return {
    x: origin.x,
    y: point.y
  };
}

function startPreviewDrag(
  elements: EditorElements,
  payload: SchematicPayload,
  event: MouseEvent,
  documentRef: Document
): void {
  if (elements.drawState || elements.panMode || event.ctrlKey || event.metaKey) {
    return;
  }

  if (event.button !== 0) {
    return;
  }

  if (isPolylineHandleTarget(event.target)) {
    return;
  }

  const itemId = findSelectablePreviewItemId(elements, payload, event.target);

  if (!itemId) {
    return;
  }

  const item = payload.items.find((candidate) => candidate.id === itemId);

  if (!item) {
    return;
  }

  const selectedIds = elements.selectedItemIds.includes(itemId) ? elements.selectedItemIds : [itemId];
  setSelectedItems(elements, selectedIds, itemId);
  renderItemTools(elements, payload, documentRef);

  const startItems = payload.items
    .filter((candidate) => selectedIds.includes(candidate.id))
    .map((candidate) => ({
      itemId: candidate.id,
      item: cloneItem(candidate)
    }));
  const unsupportedItem = startItems.find(({ item: startItem }) => !canMoveItem(startItem));

  if (unsupportedItem) {
    elements.inspectorStatus.textContent = `${unsupportedItem.item.type} cannot be dragged yet`;
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  const svg = event.currentTarget;

  if (!isSvgElement(svg, documentRef)) {
    return;
  }

  const coordinateSpace = getSvgCoordinateSpace(svg);

  elements.dragState = {
    itemId,
    startPoint: getSvgPoint(coordinateSpace, event),
    startItems,
    coordinateSpace,
    historyRecorded: false
  };

  elements.previewSurface.dataset.dragging = "true";
  event.preventDefault();

  const onMove = (moveEvent: MouseEvent): void => {
    dragSelectedPreviewItem(elements, moveEvent, documentRef);
  };
  const stopDrag = (): void => {
    documentRef.removeEventListener("mousemove", onMove);
    documentRef.removeEventListener("mouseup", stopDrag);
    delete elements.dragState;
    delete elements.previewSurface.dataset.dragging;
  };

  documentRef.addEventListener("mousemove", onMove);
  documentRef.addEventListener("mouseup", stopDrag);
}

function handlePreviewMouseDown(
  elements: EditorElements,
  payload: SchematicPayload,
  event: MouseEvent,
  documentRef: Document
): void {
  closePolylineContextMenu(elements);

  if (startPreviewPan(elements, event, documentRef)) {
    return;
  }

  if (startPolylinePointDrag(elements, payload, event, documentRef)) {
    return;
  }

  if (startSelectionRectangle(elements, payload, event, documentRef)) {
    return;
  }

  startPreviewDrag(elements, payload, event, documentRef);
}

function startSelectionRectangle(
  elements: EditorElements,
  payload: SchematicPayload,
  event: MouseEvent,
  documentRef: Document
): boolean {
  if (elements.drawState || elements.panMode || event.button !== 0) {
    return false;
  }

  const svg = event.currentTarget;

  if (!isSvgElement(svg, documentRef) || findSelectablePreviewItemId(elements, payload, event.target)) {
    return false;
  }

  const coordinateSpace = getSvgCoordinateSpace(svg);
  const startPoint = getSvgPoint(coordinateSpace, event);
  elements.selectionRectState = {
    svg,
    startPoint,
    currentPoint: startPoint,
    moved: false
  };
  event.preventDefault();

  const onMove = (moveEvent: MouseEvent): void => {
    const state = elements.selectionRectState;

    if (!state) {
      return;
    }

    state.currentPoint = getSvgPoint(coordinateSpace, moveEvent);

    if (
      Math.abs(moveEvent.clientX - event.clientX) > 3
      || Math.abs(moveEvent.clientY - event.clientY) > 3
    ) {
      state.moved = true;
      updateSelectionRectangleElement(state, documentRef);
    }
  };
  const stopSelection = (upEvent: MouseEvent): void => {
    documentRef.removeEventListener("mousemove", onMove);
    documentRef.removeEventListener("mouseup", stopSelection);

    const state = elements.selectionRectState;
    delete elements.selectionRectState;

    if (!state?.moved) {
      return;
    }

    const selectedIds = findItemsInSelectionRect(payload, getNormalizedRect(state.startPoint, state.currentPoint));
    setSelectedItems(elements, selectedIds);
    elements.selectionRectClickSuppressionPoint = {
      clientX: upEvent.clientX,
      clientY: upEvent.clientY
    };
    updateFromJson(elements, documentRef);

    if (isJsonVisible(elements)) {
      selectSelectedItemInJson(elements);
    }
  };

  documentRef.addEventListener("mousemove", onMove);
  documentRef.addEventListener("mouseup", stopSelection);
  return true;
}

function startPreviewPan(elements: EditorElements, event: MouseEvent, documentRef: Document): boolean {
  const svg = event.currentTarget;
  const shouldPan = event.button === 1 || (event.button === 0 && elements.panMode);

  if (!shouldPan || !isSvgElement(svg, documentRef)) {
    return false;
  }

  event.preventDefault();
  event.stopPropagation();

  elements.panState = {
    svg,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startViewBox: getCurrentPreviewViewBox(elements, svg),
    moved: false
  };
  elements.previewSurface.dataset.panning = "true";

  const onMove = (moveEvent: MouseEvent): void => {
    panPreview(elements, moveEvent);
  };
  const stopPan = (): void => {
    documentRef.removeEventListener("mousemove", onMove);
    documentRef.removeEventListener("mouseup", stopPan);
    delete elements.previewSurface.dataset.panning;

    if (!elements.panState?.moved) {
      delete elements.panState;
    }
  };

  documentRef.addEventListener("mousemove", onMove);
  documentRef.addEventListener("mouseup", stopPan);
  return true;
}

function panPreview(elements: EditorElements, event: MouseEvent): void {
  const panState = elements.panState;

  if (!panState) {
    return;
  }

  const bounds = getSvgRenderedBounds(panState.svg, panState.startViewBox);

  if (bounds.width <= 0 || bounds.height <= 0) {
    return;
  }

  const dx = ((event.clientX - panState.startClientX) / bounds.width) * panState.startViewBox.width;
  const dy = ((event.clientY - panState.startClientY) / bounds.height) * panState.startViewBox.height;

  if (Math.abs(event.clientX - panState.startClientX) > 2 || Math.abs(event.clientY - panState.startClientY) > 2) {
    panState.moved = true;
  }

  elements.previewViewBox = {
    ...panState.startViewBox,
    x: panState.startViewBox.x - dx,
    y: panState.startViewBox.y - dy
  };
  setSvgViewBox(panState.svg, elements.previewViewBox);
}

function startPolylinePointDrag(
  elements: EditorElements,
  payload: SchematicPayload,
  event: MouseEvent,
  documentRef: Document
): boolean {
  if (elements.drawState || event.button !== 0 || !isPolylineHandleTarget(event.target)) {
    return false;
  }

  const svg = event.currentTarget;

  if (!isSvgElement(svg, documentRef)) {
    return false;
  }

  const handleTarget = getPolylineHandleTarget(event.target);
  const itemId = handleTarget?.getAttribute("data-polyline-handle");
  const pointIndex = Number(handleTarget?.getAttribute("data-point-index"));
  const item = itemId ? payload.items.find((candidate) => candidate.id === itemId) : undefined;

  if (!item || item.type !== "polyline" || !Number.isInteger(pointIndex) || !item.points[pointIndex]) {
    return false;
  }

  setSelectedItems(elements, [item.id]);
  elements.pointDragState = {
    itemId: item.id,
    pointIndex,
    startPoint: getSvgPoint(getSvgCoordinateSpace(svg), event),
    startItem: cloneItem(item),
    coordinateSpace: getSvgCoordinateSpace(svg),
    historyRecorded: false
  };
  elements.previewSurface.dataset.dragging = "true";
  event.preventDefault();
  event.stopPropagation();

  const onMove = (moveEvent: MouseEvent): void => {
    dragPolylinePoint(elements, moveEvent, documentRef);
  };
  const stopDrag = (): void => {
    documentRef.removeEventListener("mousemove", onMove);
    documentRef.removeEventListener("mouseup", stopDrag);
    delete elements.pointDragState;
    delete elements.previewSurface.dataset.dragging;
  };

  documentRef.addEventListener("mousemove", onMove);
  documentRef.addEventListener("mouseup", stopDrag);
  return true;
}

function dragPolylinePoint(elements: EditorElements, event: MouseEvent, documentRef: Document): void {
  const pointDragState = elements.pointDragState;

  if (!pointDragState) {
    return;
  }

  const currentPoint = getSvgPoint(pointDragState.coordinateSpace, event);
  const dx = currentPoint.x - pointDragState.startPoint.x;
  const dy = currentPoint.y - pointDragState.startPoint.y;
  const result = parseAndValidatePayload(elements.jsonInput.value);

  if (!result.ok) {
    renderDisabledItemTools(elements, result.message);
    return;
  }

  const item = result.payload.items.find((candidate) => candidate.id === pointDragState.itemId);

  if (!item || item.type !== "polyline" || pointDragState.startItem.type !== "polyline") {
    elements.inspectorStatus.textContent = "Selected polyline point was not found";
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  const startPoint = pointDragState.startItem.points[pointDragState.pointIndex];

  if (!startPoint) {
    elements.inspectorStatus.textContent = "Selected polyline point was not found";
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  const movedPoint = {
    x: startPoint.x + dx,
    y: startPoint.y + dy
  };
  const orthogonalAnchor = event.shiftKey
    ? getPolylinePointOrthoAnchor(pointDragState.startItem, pointDragState.pointIndex)
    : undefined;

  if (!pointDragState.historyRecorded) {
    recordHistory(elements);
    pointDragState.historyRecorded = true;
  }

  const nextPoint = orthogonalAnchor ? lockPointOrthogonally(orthogonalAnchor, movedPoint) : movedPoint;
  item.points[pointDragState.pointIndex] = event.shiftKey ? nextPoint : snapPointIfNeeded(elements, nextPoint);
  setSelectedItems(elements, [item.id]);
  elements.jsonInput.value = formatPayloadJson(result.payload);
  updateFromJson(elements, documentRef);
  elements.inspectorStatus.textContent = `Moved point ${pointDragState.pointIndex + 1} of ${item.id}`;
  elements.inspectorStatus.dataset.state = "valid";
}

function getPolylinePointOrthoAnchor(item: SchematicItem, pointIndex: number): SchematicPoint | undefined {
  if (item.type !== "polyline") {
    return undefined;
  }

  const previousPoint = item.points[pointIndex - 1];
  const nextPoint = item.points[pointIndex + 1];

  if (!previousPoint) {
    return nextPoint;
  }

  if (!nextPoint) {
    return previousPoint;
  }

  const currentPoint = item.points[pointIndex];

  if (!currentPoint) {
    return previousPoint;
  }

  return squaredDistance(currentPoint, previousPoint) <= squaredDistance(currentPoint, nextPoint)
    ? previousPoint
    : nextPoint;
}

function getPolylineHandleTarget(target: EventTarget | null): Element | undefined {
  if (!(target instanceof Element)) {
    return undefined;
  }

  return target.closest("[data-polyline-handle]") ?? undefined;
}

function isPolylineHandleTarget(target: EventTarget | null): target is Element {
  return getPolylineHandleTarget(target) !== undefined;
}

function isSvgElement(value: EventTarget | null, documentRef: Document): value is SVGSVGElement {
  const svgConstructor = documentRef.defaultView?.SVGSVGElement;
  return svgConstructor
    ? value instanceof svgConstructor
    : value instanceof Element && value.tagName.toLowerCase() === "svg";
}

function dragSelectedPreviewItem(
  elements: EditorElements,
  event: MouseEvent,
  documentRef: Document
): void {
  if (!elements.dragState) {
    return;
  }

  const currentPoint = getSvgPoint(elements.dragState.coordinateSpace, event);
  const dx = currentPoint.x - elements.dragState.startPoint.x;
  const dy = currentPoint.y - elements.dragState.startPoint.y;

  moveSelectedItemFromDrag(elements, dx, dy, event.shiftKey, documentRef);
}

function moveSelectedItemFromDrag(
  elements: EditorElements,
  dx: number,
  dy: number,
  snapDisabled: boolean,
  documentRef: Document
): void {
  const result = parseAndValidatePayload(elements.jsonInput.value);

  if (!result.ok) {
    renderDisabledItemTools(elements, result.message);
    return;
  }

  const dragState = elements.dragState;

  if (!dragState) {
    elements.inspectorStatus.textContent = "Selected item was not found";
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  for (const start of dragState.startItems) {
    const item = result.payload.items.find((candidate) => candidate.id === start.itemId);

    if (!item) {
      elements.inspectorStatus.textContent = "Selected item was not found";
      elements.inspectorStatus.dataset.state = "error";
      return;
    }

    if (!moveItemFromStart(item, start.item, dx, dy)) {
      elements.inspectorStatus.textContent = `${item.type} cannot be dragged yet`;
      elements.inspectorStatus.dataset.state = "error";
      return;
    }
  }

  if (!dragState.historyRecorded) {
    recordHistory(elements);
    dragState.historyRecorded = true;
  }

  if (elements.snapEnabled && !snapDisabled) {
    for (const start of dragState.startItems) {
      const item = result.payload.items.find((candidate) => candidate.id === start.itemId);

      if (item) {
        snapItemToGrid(item, elements.gridSize);
      }
    }
  }

  setSelectedItems(elements, dragState.startItems.map((start) => start.itemId), dragState.itemId);
  elements.jsonInput.value = formatPayloadJson(result.payload);
  updateFromJson(elements, documentRef);
  elements.inspectorStatus.textContent = dragState.startItems.length === 1
    ? `Moved ${dragState.itemId}`
    : `Moved ${dragState.startItems.length} items`;
  elements.inspectorStatus.dataset.state = "valid";
}

function getSvgCoordinateSpace(svg: SVGSVGElement): SvgCoordinateSpace {
  const viewBox = parseViewBox(svg.getAttribute("viewBox"));
  const bounds = getSvgRenderedBounds(svg, viewBox);

  return {
    viewBox,
    bounds
  };
}

function getSvgRenderedBounds(
  svg: SVGSVGElement,
  viewBox: PreviewViewBox | undefined
): { left: number; top: number; width: number; height: number } {
  const rect = svg.getBoundingClientRect();
  const fallback = {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height
  };

  if (!viewBox || rect.width <= 0 || rect.height <= 0 || viewBox.width <= 0 || viewBox.height <= 0) {
    return fallback;
  }

  const preserveAspectRatio = svg.getAttribute("preserveAspectRatio") ?? "xMidYMid meet";

  if (preserveAspectRatio.includes("none")) {
    return fallback;
  }

  const scale = preserveAspectRatio.includes("slice")
    ? Math.max(rect.width / viewBox.width, rect.height / viewBox.height)
    : Math.min(rect.width / viewBox.width, rect.height / viewBox.height);
  const width = viewBox.width * scale;
  const height = viewBox.height * scale;
  const left = rect.left + getAlignedOffset(rect.width, width, preserveAspectRatio, "x");
  const top = rect.top + getAlignedOffset(rect.height, height, preserveAspectRatio, "y");

  return { left, top, width, height };
}

function getAlignedOffset(
  availableSize: number,
  renderedSize: number,
  preserveAspectRatio: string,
  axis: "x" | "y"
): number {
  const lower = preserveAspectRatio.toLowerCase();

  if (axis === "x" && lower.includes("xmax") || axis === "y" && lower.includes("ymax")) {
    return availableSize - renderedSize;
  }

  if (axis === "x" && lower.includes("xmin") || axis === "y" && lower.includes("ymin")) {
    return 0;
  }

  return (availableSize - renderedSize) / 2;
}

function getSvgPoint(coordinateSpace: SvgCoordinateSpace, event: MouseEvent): SchematicPoint {
  const { viewBox, bounds } = coordinateSpace;

  if (!viewBox || bounds.width <= 0 || bounds.height <= 0) {
    return {
      x: event.clientX,
      y: event.clientY
    };
  }

  return {
    x: viewBox.x + ((event.clientX - bounds.left) / bounds.width) * viewBox.width,
    y: viewBox.y + ((event.clientY - bounds.top) / bounds.height) * viewBox.height
  };
}

function parseViewBox(value: string | null): PreviewViewBox | undefined {
  const parts = value?.trim().split(/\s+/).map(Number);

  if (!parts || parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    return undefined;
  }

  const [x, y, width, height] = parts;
  return { x, y, width, height };
}

function cloneItem(item: SchematicItem): SchematicItem {
  return JSON.parse(JSON.stringify(item)) as SchematicItem;
}

function highlightSelectedPreviewItem(elements: EditorElements): void {
  for (const element of elements.previewSurface.querySelectorAll("[data-editor-selected]")) {
    element.removeAttribute("data-editor-selected");
  }

  if (elements.selectedItemIds.length === 0) {
    return;
  }

  const selectedIds = new Set(elements.selectedItemIds);

  for (const element of elements.previewSurface.querySelectorAll("[data-id]")) {
    if (selectedIds.has(element.getAttribute("data-id") ?? "")) {
      element.setAttribute("data-editor-selected", "true");
    }
  }
}

function selectSelectedItemInJson(elements: EditorElements): void {
  if (!elements.selectedItemId) {
    return;
  }

  const range = findItemBlockRange(elements.jsonInput.value, elements.selectedItemId);

  if (!range) {
    return;
  }

  elements.jsonInput.focus();
  elements.jsonInput.setSelectionRange(range.start, range.end);
  elements.jsonInput.scrollTop = estimateTextareaScrollTop(elements.jsonInput.value, range.start);
}

function clearJsonSelection(elements: EditorElements): void {
  elements.jsonInput.setSelectionRange(0, 0);
}

function findItemIdIndex(json: string, itemId: string): number {
  const itemIdPattern = `"id": "${itemId}"`;
  const itemsIndex = json.indexOf("\"items\": [");
  const searchStart = itemsIndex === -1 ? 0 : itemsIndex;
  return json.indexOf(itemIdPattern, searchStart);
}

function findItemBlockRange(json: string, itemId: string): { start: number; end: number } | undefined {
  const idIndex = findItemIdIndex(json, itemId);

  if (idIndex === -1) {
    return undefined;
  }

  const start = json.lastIndexOf("{", idIndex);

  if (start === -1) {
    return undefined;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < json.length; index += 1) {
    const char = json[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = inString;
      continue;
    }

    if (char === "\"") {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return {
          start,
          end: index + 1
        };
      }
    }
  }

  return undefined;
}

function estimateTextareaScrollTop(value: string, index: number): number {
  const line = value.slice(0, index).split("\n").length - 1;
  return Math.max(0, line - 3) * 17;
}

function renderInspector(
  elements: EditorElements,
  item: SchematicItem,
  payload: SchematicPayload,
  documentRef: Document
): void {
  elements.inspector.replaceChildren();
  elements.inspectorStatus.textContent = `Selected ${item.id}`;
  elements.inspectorStatus.dataset.state = "valid";

  appendInspectorField(elements, documentRef, item, "id", "text");
  appendInspectorField(elements, documentRef, item, "layer", "number");

  if (hasEditableField(item, "x")) {
    appendInspectorField(elements, documentRef, item, "x", "number");
  }

  if (hasEditableField(item, "y")) {
    appendInspectorField(elements, documentRef, item, "y", "number");
  }

  if (hasEditableField(item, "text")) {
    appendInspectorField(elements, documentRef, item, "text", "text");
  }

  appendSymbolMetadataInspector(elements, documentRef, item, payload);
  appendStyleInspector(elements, documentRef, item);
}

function appendSymbolMetadataInspector(
  elements: EditorElements,
  documentRef: Document,
  item: SchematicItem,
  payload: SchematicPayload
): void {
  if (item.type !== "symbol") {
    return;
  }

  const definition = payload.symbols?.find((symbol) => symbol.id === item.symbolId);
  const section = documentRef.createElement("section");
  section.className = "symbol-inspector-section";

  const heading = documentRef.createElement("div");
  heading.className = "field-label";
  heading.textContent = "Symbol metadata";
  section.append(heading);

  const definitionRow = documentRef.createElement("div");
  definitionRow.className = "symbol-inspector-row";
  definitionRow.textContent = `Definition: ${item.symbolId}`;
  section.append(definitionRow);

  if (!definition) {
    const missing = documentRef.createElement("div");
    missing.className = "field-helper";
    missing.textContent = "No matching symbol definition found.";
    section.append(missing);
    elements.inspector.append(section);
    return;
  }

  section.append(createSymbolMetadataGroup(
    documentRef,
    "Parts",
    definition.parts?.map((part) => {
      const label = part.label ? `${part.id} - ${part.label}` : part.id;
      return part.itemIds && part.itemIds.length > 0
        ? `${label} (${part.itemIds.join(", ")})`
        : label;
    }) ?? []
  ));
  section.append(createSymbolMetadataGroup(
    documentRef,
    "Entity slots",
    definition.entitySlots?.map((slot) => {
      const label = slot.label ? `${slot.id} - ${slot.label}` : slot.id;
      const required = slot.required ? " required" : "";
      return slot.description
        ? `${label}${required}: ${slot.description}`
        : `${label}${required}`;
    }) ?? []
  ));

  elements.inspector.append(section);
}

function createSymbolMetadataGroup(documentRef: Document, label: string, values: string[]): HTMLElement {
  const group = documentRef.createElement("div");
  group.className = "symbol-inspector-group";

  const title = documentRef.createElement("div");
  title.className = "symbol-inspector-group-title";
  title.textContent = label;
  group.append(title);

  if (values.length === 0) {
    const empty = documentRef.createElement("div");
    empty.className = "field-helper";
    empty.textContent = "None defined";
    group.append(empty);
    return group;
  }

  const list = documentRef.createElement("ul");
  list.className = "symbol-inspector-list";

  for (const value of values) {
    const item = documentRef.createElement("li");
    item.textContent = value;
    list.append(item);
  }

  group.append(list);
  return group;
}

function renderNeutralInspector(elements: EditorElements, message: string): void {
  elements.inspector.replaceChildren();
  updateSelectedItemActionButtons(elements, false);
  elements.inspectorStatus.textContent = message;
  elements.inspectorStatus.dataset.state = "neutral";
}

function appendInspectorField(
  elements: EditorElements,
  documentRef: Document,
  item: SchematicItem,
  fieldName: "id" | "layer" | "x" | "y" | "text",
  valueType: "number" | "text"
): void {
  const label = documentRef.createElement("label");
  label.className = "inspector-field";
  label.dataset.fieldName = fieldName;

  const labelText = documentRef.createElement("span");
  labelText.className = "field-label";
  labelText.textContent = INSPECTOR_FIELD_LABELS[fieldName];

  const input = documentRef.createElement("input");
  input.className = "inspector-input";
  input.type = "text";
  input.value = String(getEditableFieldValue(item, fieldName));

  if (valueType === "number") {
    input.inputMode = "decimal";
  }

  const helper = documentRef.createElement("span");
  helper.className = "field-helper";
  helper.textContent = fieldName === "layer"
    ? "Higher layers render in front."
    : fieldName === "id"
      ? "Unique id used for selection and JSON lookup."
      : "";

  input.addEventListener("change", () => {
    updateSelectedItemField(elements, fieldName, input.value, valueType, documentRef);
  });

  label.append(labelText, input);
  if (helper.textContent) {
    label.append(helper);
  }
  elements.inspector.append(label);
}

function appendStyleInspector(elements: EditorElements, documentRef: Document, item: SchematicItem): void {
  const fields = getStyleFieldConfigs(item);

  if (fields.length === 0) {
    return;
  }

  const section = documentRef.createElement("section");
  section.className = "style-inspector-section";

  const heading = documentRef.createElement("div");
  heading.className = "field-label";
  heading.textContent = "Style";

  section.append(heading);

  for (const field of fields) {
    appendStyleField(elements, documentRef, section, item, field);
  }

  elements.inspector.append(section);
}

function appendStyleField(
  elements: EditorElements,
  documentRef: Document,
  section: HTMLElement,
  item: SchematicItem,
  field: StyleFieldConfig
): void {
  const fieldElement = documentRef.createElement("div");
  fieldElement.className = "inspector-field style-inspector-field";
  fieldElement.dataset.fieldName = field.name;

  const labelText = documentRef.createElement("span");
  labelText.className = "field-label";
  labelText.textContent = STYLE_FIELD_LABELS[field.name];

  const input = documentRef.createElement("input");
  input.className = "inspector-input style-inspector-input";
  input.type = "text";
  input.value = formatStyleFieldValue(item.style?.[field.name], field.name);

  if (field.valueType === "number") {
    input.inputMode = "decimal";
  }

  input.addEventListener("change", () => {
    updateSelectedItemStyleField(elements, field, input.value, documentRef);
  });

  fieldElement.append(labelText);

  if (field.name === "stroke" || field.name === "fill") {
    fieldElement.append(createPaintFieldControls(elements, documentRef, field, input));
  } else if (field.valueType === "number") {
    fieldElement.append(createNumberFieldControls(elements, documentRef, field, input));
  } else {
    fieldElement.append(input);
  }

  const helperText = STYLE_FIELD_HELPERS[field.name];

  if (helperText) {
    const helper = documentRef.createElement("span");
    helper.className = "field-helper";
    helper.textContent = helperText;
    fieldElement.append(helper);
  }

  section.append(fieldElement);
}

function createNumberFieldControls(
  elements: EditorElements,
  documentRef: Document,
  field: StyleFieldConfig,
  input: HTMLInputElement
): HTMLElement {
  const controls = documentRef.createElement("div");
  controls.className = "number-field-controls";

  const sliderConfig = getStyleSliderConfig(field.name);

  if (!sliderConfig) {
    controls.append(input);
    return controls;
  }

  const slider = documentRef.createElement("input");
  slider.className = "style-slider-input";
  slider.type = "range";
  slider.min = String(sliderConfig.min);
  slider.max = String(sliderConfig.max);
  slider.step = String(sliderConfig.step);
  slider.value = input.value.length > 0 ? input.value : String(sliderConfig.fallback);
  slider.title = STYLE_FIELD_LABELS[field.name];

  input.addEventListener("change", () => {
    if (input.value.length > 0 && Number.isFinite(Number(input.value))) {
      slider.value = input.value;
    }
  });
  slider.addEventListener("input", () => {
    input.value = slider.value;
    updateSelectedItemStyleField(elements, field, input.value, documentRef, { renderTools: false });
  });

  controls.append(input, slider);
  return controls;
}

function getStyleSliderConfig(fieldName: StyleFieldName): StyleSliderConfig | undefined {
  switch (fieldName) {
    case "opacity":
      return { min: 0, max: 100, step: 1, fallback: 100 };
    case "strokeWidth":
      return { min: 0, max: 20, step: 0.5, fallback: 1 };
    case "fontSize":
      return { min: 6, max: 72, step: 1, fallback: 14 };
    default:
      return undefined;
  }
}

function createPaintFieldControls(
  elements: EditorElements,
  documentRef: Document,
  field: StyleFieldConfig,
  input: HTMLInputElement
): HTMLElement {
  const group = documentRef.createElement("div");
  group.className = "paint-field-group";

  const controls = documentRef.createElement("div");
  controls.className = "paint-field-controls";

  const colorInput = documentRef.createElement("input");
  colorInput.className = "style-color-input";
  colorInput.type = "color";
  colorInput.value = isHexColor(input.value) ? normalizeHexColor(input.value) : "#000000";
  colorInput.title = "Pick color";
  colorInput.addEventListener("input", () => {
    input.value = colorInput.value;
    updateSelectedItemStyleField(elements, field, input.value, documentRef);
  });

  const presetSelect = documentRef.createElement("select");
  presetSelect.className = "style-preset-select";
  presetSelect.title = "Use theme colors";

  const emptyOption = documentRef.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "Use theme colors...";
  presetSelect.append(emptyOption);

  for (const preset of THEME_TOKEN_PRESETS) {
    const option = documentRef.createElement("option");
    option.value = preset.value;
    option.textContent = preset.label;
    presetSelect.append(option);
  }

  presetSelect.value = THEME_TOKEN_PRESETS.some((preset) => preset.value === input.value) ? input.value : "";
  presetSelect.addEventListener("change", () => {
    if (!presetSelect.value) {
      return;
    }

    input.value = presetSelect.value;
    updateSelectedItemStyleField(elements, field, input.value, documentRef);
  });

  controls.append(input, colorInput);
  group.append(controls, presetSelect);
  return group;
}

function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value) || /^#[0-9a-fA-F]{3}$/.test(value);
}

function normalizeHexColor(value: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    return value;
  }

  const [, red, green, blue] = value.match(/^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/) ?? [];
  return red && green && blue ? `#${red}${red}${green}${green}${blue}${blue}` : "#000000";
}

function getStyleFieldConfigs(item: SchematicItem): StyleFieldConfig[] {
  switch (item.type) {
    case "text":
    case "entityValue":
      return TEXT_STYLE_FIELDS;
    case "line":
    case "polyline":
    case "path":
      return LINE_STYLE_FIELDS;
    case "rect":
    case "circle":
    case "group":
    case "symbol":
      return PAINT_STYLE_FIELDS;
  }
}

function formatStyleFieldValue(value: SchematicStyle[StyleFieldName] | undefined, fieldName: StyleFieldName): string {
  if (value === undefined) {
    return "";
  }

  if (fieldName === "opacity" && typeof value === "number") {
    return String(Math.round(value * 100));
  }

  return String(value);
}

function updateSelectedItemField(
  elements: EditorElements,
  fieldName: "id" | "layer" | "x" | "y" | "text",
  rawValue: string,
  valueType: "number" | "text",
  documentRef: Document
): void {
  const result = parseAndValidatePayload(elements.jsonInput.value);

  if (!result.ok) {
    renderDisabledItemTools(elements, result.message);
    return;
  }

  const item = result.payload.items.find((candidate) => candidate.id === elements.selectedItemId);

  if (!item) {
    elements.inspectorStatus.textContent = "Selected item was not found";
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  const nextValue = valueType === "number" ? Number(rawValue) : rawValue;

  if (valueType === "number" && !Number.isFinite(nextValue)) {
    elements.inspectorStatus.textContent = `${fieldName} must be a finite number`;
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  if ((item as Record<string, unknown>)[fieldName] === nextValue) {
    return;
  }

  recordHistory(elements);
  (item as Record<string, unknown>)[fieldName] = nextValue;

  if (fieldName === "id") {
    setSelectedItems(elements, [rawValue]);
  }

  elements.jsonInput.value = formatPayloadJson(result.payload);
  updateFromJson(elements, documentRef);
}

function updateSelectedItemStyleField(
  elements: EditorElements,
  field: StyleFieldConfig,
  rawValue: string,
  documentRef: Document,
  options: { renderTools?: boolean } = {}
): void {
  const result = parseAndValidatePayload(elements.jsonInput.value);

  if (!result.ok) {
    renderDisabledItemTools(elements, result.message);
    return;
  }

  const item = result.payload.items.find((candidate) => candidate.id === elements.selectedItemId);

  if (!item) {
    elements.inspectorStatus.textContent = "Selected item was not found";
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  const parsedValue = parseStyleFieldValue(field, rawValue);

  if (!parsedValue.ok) {
    elements.inspectorStatus.textContent = parsedValue.message;
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  const currentValue = item.style?.[field.name];

  if (currentValue === parsedValue.value) {
    return;
  }

  recordHistory(elements);

  if (parsedValue.value === undefined) {
    delete item.style?.[field.name];

    if (item.style && Object.keys(item.style).length === 0) {
      delete item.style;
    }
  } else {
    item.style = {
      ...item.style,
      [field.name]: parsedValue.value
    };
  }

  elements.jsonInput.value = formatPayloadJson(result.payload);
  updateFromJson(elements, documentRef, options);
  elements.inspectorStatus.textContent = `Updated ${field.name} for ${item.id}`;
  elements.inspectorStatus.dataset.state = "valid";
}

function parseStyleFieldValue(
  field: StyleFieldConfig,
  rawValue: string
): { ok: true; value: SchematicStyle[StyleFieldName] | undefined } | { ok: false; message: string } {
  const value = rawValue.trim();

  if (value.length === 0) {
    return {
      ok: true,
      value: undefined
    };
  }

  if (field.valueType === "number") {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
      return {
        ok: false,
        message: `${field.name} must be a finite number`
      };
    }

    return {
      ok: true,
      value: field.name === "opacity" ? numberValue / 100 : numberValue
    };
  }

  if (field.valueType === "fontWeight") {
    if (value === "normal" || value === "bold") {
      return {
        ok: true,
        value
      };
    }

    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
      return {
        ok: false,
        message: `${field.name} must be normal, bold, or a finite number`
      };
    }

    return {
      ok: true,
      value: numberValue
    };
  }

  if (field.valueType === "textAnchor" && value !== "start" && value !== "middle" && value !== "end") {
    return {
      ok: false,
      message: `${field.name} must be start, middle, or end`
    };
  }

  return {
    ok: true,
    value
  };
}

function handleEditorKeyDown(elements: EditorElements, event: KeyboardEvent, documentRef: Document): void {
  const historyShortcut = getHistoryShortcut(event);

  if (historyShortcut) {
    event.preventDefault();

    if (historyShortcut === "undo") {
      undoEditorChange(elements, documentRef);
      return;
    }

    redoEditorChange(elements, documentRef);
    return;
  }

  if (isTypingTarget(event.target)) {
    return;
  }

  if (elements.drawState && event.key === "Enter") {
    event.preventDefault();
    finishPolylineDrawing(elements, documentRef);
    return;
  }

  if (elements.drawState && event.key === "Escape") {
    event.preventDefault();
    cancelPolylineDrawing(elements, documentRef);
    return;
  }

  if (event.key === "Escape" && elements.selectedItemId) {
    const result = parseAndValidatePayload(elements.jsonInput.value);

    if (result.ok) {
      event.preventDefault();
      clearSelection(elements, result.payload, documentRef);
    }

    return;
  }

  if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    deleteSelectedItem(elements, documentRef);
    return;
  }

  const delta = getKeyboardNudgeDelta(event);

  if (!delta) {
    return;
  }

  event.preventDefault();
  nudgeSelectedItem(elements, delta.dx, delta.dy, documentRef);
}

function getHistoryShortcut(event: KeyboardEvent): "undo" | "redo" | undefined {
  if (!event.ctrlKey && !event.metaKey) {
    return undefined;
  }

  const key = event.key.toLowerCase();

  if (key === "z" && event.shiftKey) {
    return "redo";
  }

  if (key === "z") {
    return "undo";
  }

  if (key === "y") {
    return "redo";
  }

  return undefined;
}

function getKeyboardNudgeDelta(event: KeyboardEvent): { dx: number; dy: number } | undefined {
  const amount = event.shiftKey ? 10 : 1;

  switch (event.key) {
    case "ArrowUp":
      return { dx: 0, dy: -amount };
    case "ArrowDown":
      return { dx: 0, dy: amount };
    case "ArrowLeft":
      return { dx: -amount, dy: 0 };
    case "ArrowRight":
      return { dx: amount, dy: 0 };
    default:
      return undefined;
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

function nudgeSelectedItem(elements: EditorElements, dx: number, dy: number, documentRef: Document): void {
  const result = parseAndValidatePayload(elements.jsonInput.value);

  if (!result.ok) {
    renderDisabledItemTools(elements, result.message);
    return;
  }

  const selectedIds = getSelectedItemIds(elements, result.payload);
  const selectedItems = result.payload.items.filter((item) => selectedIds.includes(item.id));

  if (selectedItems.length === 0) {
    elements.inspectorStatus.textContent = "Selected item was not found";
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  const unsupportedItem = selectedItems.find((item) => !canMoveItem(item));

  if (unsupportedItem) {
    elements.inspectorStatus.textContent = `${unsupportedItem.type} cannot be nudged yet`;
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  recordHistory(elements);

  for (const item of selectedItems) {
    moveItem(item, dx, dy);
  }

  elements.jsonInput.value = formatPayloadJson(result.payload);
  updateFromJson(elements, documentRef);
  elements.inspectorStatus.textContent = selectedItems.length === 1
    ? `Moved ${selectedItems[0]!.id}`
    : `Moved ${selectedItems.length} items`;
  elements.inspectorStatus.dataset.state = "valid";
}

function canMoveItem(item: SchematicItem): boolean {
  return hasNumberField(item, "x")
    || hasNumberField(item, "cx")
    || hasNumberField(item, "x1")
    || (item.type === "polyline" && item.points.length > 0);
}

function moveItem(item: SchematicItem, dx: number, dy: number): boolean {
  if (hasNumberField(item, "x") && hasNumberField(item, "y")) {
    item.x += dx;
    item.y += dy;
    return true;
  }

  if (hasNumberField(item, "cx") && hasNumberField(item, "cy")) {
    item.cx += dx;
    item.cy += dy;
    return true;
  }

  if (
    hasNumberField(item, "x1")
    && hasNumberField(item, "y1")
    && hasNumberField(item, "x2")
    && hasNumberField(item, "y2")
  ) {
    item.x1 += dx;
    item.y1 += dy;
    item.x2 += dx;
    item.y2 += dy;
    return true;
  }

  if (item.type === "polyline") {
    item.points = item.points.map((point) => ({
      x: point.x + dx,
      y: point.y + dy
    }));
    return item.points.length > 0;
  }

  return false;
}

function moveItemFromStart(item: SchematicItem, startItem: SchematicItem, dx: number, dy: number): boolean {
  if (
    hasNumberField(startItem, "x")
    && hasNumberField(startItem, "y")
    && hasNumberField(item, "x")
    && hasNumberField(item, "y")
  ) {
    item.x = startItem.x + dx;
    item.y = startItem.y + dy;
    return true;
  }

  if (
    hasNumberField(startItem, "cx")
    && hasNumberField(startItem, "cy")
    && hasNumberField(item, "cx")
    && hasNumberField(item, "cy")
  ) {
    item.cx = startItem.cx + dx;
    item.cy = startItem.cy + dy;
    return true;
  }

  if (
    hasNumberField(startItem, "x1")
    && hasNumberField(startItem, "y1")
    && hasNumberField(startItem, "x2")
    && hasNumberField(startItem, "y2")
    && hasNumberField(item, "x1")
    && hasNumberField(item, "y1")
    && hasNumberField(item, "x2")
    && hasNumberField(item, "y2")
  ) {
    item.x1 = startItem.x1 + dx;
    item.y1 = startItem.y1 + dy;
    item.x2 = startItem.x2 + dx;
    item.y2 = startItem.y2 + dy;
    return true;
  }

  if (item.type === "polyline" && startItem.type === "polyline" && startItem.points.length > 0) {
    item.points = startItem.points.map((point) => ({
      x: point.x + dx,
      y: point.y + dy
    }));
    return true;
  }

  return false;
}

function snapItemToGrid(item: SchematicItem, gridSize: number): boolean {
  if (hasNumberField(item, "x") && hasNumberField(item, "y")) {
    item.x = snapNumber(item.x, gridSize);
    item.y = snapNumber(item.y, gridSize);
    return true;
  }

  if (hasNumberField(item, "cx") && hasNumberField(item, "cy")) {
    item.cx = snapNumber(item.cx, gridSize);
    item.cy = snapNumber(item.cy, gridSize);
    return true;
  }

  if (
    hasNumberField(item, "x1")
    && hasNumberField(item, "y1")
    && hasNumberField(item, "x2")
    && hasNumberField(item, "y2")
  ) {
    item.x1 = snapNumber(item.x1, gridSize);
    item.y1 = snapNumber(item.y1, gridSize);
    item.x2 = snapNumber(item.x2, gridSize);
    item.y2 = snapNumber(item.y2, gridSize);
    return true;
  }

  if (item.type === "polyline") {
    item.points = item.points.map((point) => ({
      x: snapNumber(point.x, gridSize),
      y: snapNumber(point.y, gridSize)
    }));
    return item.points.length > 0;
  }

  return false;
}

function snapNumber(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

function hasEditableField(item: SchematicItem, fieldName: "x" | "y" | "text"): boolean {
  return Object.prototype.hasOwnProperty.call(item, fieldName);
}

function hasNumberField<T extends string>(item: SchematicItem, fieldName: T): item is SchematicItem & Record<T, number> {
  return typeof (item as Record<string, unknown>)[fieldName] === "number";
}

function getEditableFieldValue(
  item: SchematicItem,
  fieldName: "id" | "layer" | "x" | "y" | "text"
): string | number {
  if (fieldName === "id" || fieldName === "layer") {
    return item[fieldName];
  }

  if (hasEditableField(item, fieldName)) {
    const value = (item as Record<string, unknown>)[fieldName];
    return typeof value === "string" || typeof value === "number" ? value : "";
  }

  return "";
}

function importEncodedPayload(elements: EditorElements, documentRef: Document): void {
  const result = decodePayload(elements.importInput.value);

  if (!result.ok) {
    elements.status.textContent = `Import error:\n${result.errors.map((error) => `- ${error}`).join("\n")}`;
    elements.status.dataset.state = "error";
    return;
  }

  recordHistory(elements);
  elements.jsonInput.value = formatPayloadJson(result.payload);
  updateFromJson(elements, documentRef);
  elements.status.textContent = "Imported payload";
  elements.status.dataset.state = "valid";
}

function applyThemePreview(elements: EditorElements): void {
  const result = parseThemeVariables(elements.themeInput.value);

  if (!result.ok) {
    elements.themeStatus.textContent = result.message;
    elements.themeStatus.dataset.state = "error";
    return;
  }

  getEditorLocalStorage(elements)?.setItem(THEME_STORAGE_KEY, elements.themeInput.value);
  elements.previewSurface.removeAttribute("style");

  for (const [name, value] of Object.entries(result.variables)) {
    elements.previewSurface.style.setProperty(name, value);
  }

  elements.themeStatus.textContent = `Applied ${Object.keys(result.variables).length} theme variables`;
  elements.themeStatus.dataset.state = "valid";
}

function loadStoredThemePreview(elements: EditorElements): void {
  const storedTheme = getEditorLocalStorage(elements)?.getItem(THEME_STORAGE_KEY);

  if (!storedTheme) {
    return;
  }

  elements.themeInput.value = storedTheme;
  applyThemePreview(elements);
}

function getEditorLocalStorage(elements: EditorElements): Storage | undefined {
  try {
    return elements.editorRoot.ownerDocument.defaultView?.localStorage;
  } catch {
    return undefined;
  }
}

function parseThemeVariables(value: string): { ok: true; variables: Record<string, string> } | { ok: false; message: string } {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch (error) {
    return {
      ok: false,
      message: `Theme JSON error: ${error instanceof Error ? error.message : String(error)}`
    };
  }

  if (!isRecord(parsed) || parsed.type !== "ha-schematic-card-theme-variables" || !isRecord(parsed.variables)) {
    return {
      ok: false,
      message: "Theme JSON error: expected exported theme variables JSON"
    };
  }

  const variables: Record<string, string> = {};

  for (const [name, variableValue] of Object.entries(parsed.variables)) {
    if (name.startsWith("--") && typeof variableValue === "string") {
      variables[name] = variableValue.trim();
    }
  }

  if (Object.keys(variables).length === 0) {
    return {
      ok: false,
      message: "Theme JSON error: no CSS variables found"
    };
  }

  return {
    ok: true,
    variables
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function copyExportedPayload(elements: EditorElements): Promise<void> {
  if (!elements.exportOutput.value) {
    elements.status.textContent = "No valid export to copy";
    elements.status.dataset.state = "error";
    return;
  }

  try {
    await navigator.clipboard.writeText(elements.exportOutput.value);
    elements.status.textContent = "Copied";
    elements.status.dataset.state = "valid";
  } catch {
    elements.exportOutput.focus();
    elements.exportOutput.select();
    elements.status.textContent = "Select and copy";
  }
}

function openTransferPanel(elements: EditorElements, mode: "import" | "export" | "theme"): void {
  elements.transferPanel.hidden = false;
  elements.transferPanel.dataset.mode = mode;
  elements.transferPanelTitle.textContent = mode === "import"
    ? "Import Payload"
    : mode === "export"
      ? "Export Payload"
      : "Theme Preview";
  elements.importSection.hidden = mode !== "import";
  elements.exportSection.hidden = mode !== "export";
  elements.themeInput.closest<HTMLElement>(".theme-section")!.hidden = mode !== "theme";
}

function closeTransferPanel(elements: EditorElements): void {
  elements.transferPanel.hidden = true;
  delete elements.transferPanel.dataset.mode;
}

function createResizeHandle(documentRef: Document, shell: HTMLElement): HTMLElement {
  const handle = documentRef.createElement("div");
  handle.className = "editor-resize-handle";
  handle.setAttribute("role", "separator");
  handle.setAttribute("aria-orientation", "vertical");

  handle.addEventListener("mousedown", (event) => {
    event.preventDefault();
    startEditorResize(documentRef, shell);
  });

  return handle;
}

function startEditorResize(documentRef: Document, shell: HTMLElement): void {
  const onMove = (event: MouseEvent): void => {
    const shellLeft = shell.getBoundingClientRect().left;
    const availableWidth = getAvailableEditorWidth(documentRef, shell);
    const maxWidth = Math.max(320, Math.min(760, availableWidth - 360));
    const nextWidth = clamp(event.clientX - shellLeft, 300, maxWidth);
    shell.style.setProperty("--editor-left-width", `${Math.round(nextWidth)}px`);
  };

  const stopResize = (): void => {
    documentRef.removeEventListener("mousemove", onMove);
    documentRef.removeEventListener("mouseup", stopResize);
  };

  documentRef.addEventListener("mousemove", onMove);
  documentRef.addEventListener("mouseup", stopResize);
}

function getAvailableEditorWidth(documentRef: Document, shell: HTMLElement): number {
  return shell.clientWidth || documentRef.defaultView?.innerWidth || 1100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function createJsonPane(documentRef: Document): HTMLElement {
  const pane = createPane(documentRef, "Editor");

  const jsonInput = documentRef.createElement("textarea");
  jsonInput.className = "json-input";
  jsonInput.spellcheck = false;

  const tabList = documentRef.createElement("div");
  tabList.className = "editor-tabs";
  tabList.setAttribute("role", "tablist");

  const itemsTab = documentRef.createElement("button");
  itemsTab.className = "editor-tab";
  itemsTab.type = "button";
  itemsTab.dataset.editorTab = "items";
  itemsTab.setAttribute("role", "tab");
  itemsTab.setAttribute("aria-selected", "true");
  itemsTab.textContent = "Items";

  const inspectorTab = documentRef.createElement("button");
  inspectorTab.className = "editor-tab";
  inspectorTab.type = "button";
  inspectorTab.dataset.editorTab = "inspector";
  inspectorTab.setAttribute("role", "tab");
  inspectorTab.setAttribute("aria-selected", "false");
  inspectorTab.textContent = "Inspector";

  const jsonTab = documentRef.createElement("button");
  jsonTab.className = "editor-tab";
  jsonTab.type = "button";
  jsonTab.dataset.editorTab = "json";
  jsonTab.setAttribute("role", "tab");
  jsonTab.setAttribute("aria-selected", "false");
  jsonTab.textContent = "JSON";

  tabList.append(itemsTab, inspectorTab, jsonTab);

  const itemTools = documentRef.createElement("section");
  itemTools.className = "item-tools";

  const primaryPanel = documentRef.createElement("div");
  primaryPanel.className = "editor-primary-panel";

  const tabDropZone = documentRef.createElement("div");
  tabDropZone.className = "editor-tab-drop-zone";
  tabDropZone.textContent = "Drop tab here to split panel";

  const dockedPanel = documentRef.createElement("div");
  dockedPanel.className = "editor-docked-panel";
  dockedPanel.hidden = true;

  const dockedPanelTab = documentRef.createElement("button");
  dockedPanelTab.className = "editor-docked-tab";
  dockedPanelTab.type = "button";
  dockedPanelTab.hidden = true;

  const itemListSection = documentRef.createElement("section");
  itemListSection.className = "editor-tab-panel item-list-section";
  itemListSection.dataset.panel = "items";

  const itemListLabel = documentRef.createElement("div");
  itemListLabel.className = "field-label";
  itemListLabel.textContent = "Items";

  const itemList = documentRef.createElement("div");
  itemList.className = "item-list";

  const symbolSummary = documentRef.createElement("div");
  symbolSummary.className = "symbol-summary";

  const inspectorSection = documentRef.createElement("section");
  inspectorSection.className = "editor-tab-panel inspector-section";
  inspectorSection.dataset.panel = "inspector";
  inspectorSection.hidden = true;

  const inspectorLabel = documentRef.createElement("div");
  inspectorLabel.className = "field-label";
  inspectorLabel.textContent = "Inspector";

  const inspector = documentRef.createElement("div");
  inspector.className = "property-inspector";

  const inspectorStatus = documentRef.createElement("span");
  inspectorStatus.className = "inspector-status";
  inspectorStatus.textContent = "Select an item";

  const jsonSection = documentRef.createElement("section");
  jsonSection.className = "editor-tab-panel json-editor-section";
  jsonSection.dataset.panel = "json";
  jsonSection.hidden = true;

  itemListSection.append(itemListLabel, itemList, symbolSummary);
  inspectorSection.append(inspectorLabel, inspector, inspectorStatus);
  jsonSection.append(jsonInput);
  primaryPanel.append(itemListSection, inspectorSection, jsonSection);
  dockedPanel.append(dockedPanelTab);
  itemTools.append(tabList, primaryPanel, tabDropZone, dockedPanel);
  pane.append(itemTools);
  return pane;
}

function createGlobalToolbar(documentRef: Document): HTMLElement {
  const toolbar = documentRef.createElement("header");
  toolbar.className = "editor-topbar";

  const toolGroup = createToolbarGroup(documentRef, "Tools");

  const selectToolButton = createToolbarButton(documentRef, "select-tool-button", "Pointer");
  selectToolButton.textContent = "↖";
  selectToolButton.title = "Pointer";
  selectToolButton.setAttribute("aria-label", "Pointer");
  selectToolButton.setAttribute("aria-pressed", "true");

  const panToolButton = createToolbarButton(documentRef, "pan-tool-button", "🤚");
  panToolButton.title = "Pan";
  panToolButton.setAttribute("aria-label", "Pan");
  panToolButton.setAttribute("aria-pressed", "false");

  const drawPolylineButton = createToolbarButton(documentRef, "draw-polyline-button", "Draw Polyline");
  drawPolylineButton.setAttribute("aria-pressed", "false");

  const finishPolylineButton = createToolbarButton(documentRef, "finish-polyline-button", "Finish");
  finishPolylineButton.hidden = true;

  toolGroup.append(selectToolButton, panToolButton, drawPolylineButton, finishPolylineButton);

  const addGroup = createToolbarGroup(documentRef, "Add");
  addGroup.append(
    createToolbarButton(documentRef, "add-text-button", "Text"),
    createToolbarButton(documentRef, "add-rect-button", "Rect"),
    createToolbarButton(documentRef, "add-circle-button", "Circle")
  );

  const selectionGroup = createToolbarGroup(documentRef, "Selection");
  const duplicateItemButton = createToolbarButton(documentRef, "duplicate-item-button", "Duplicate");
  duplicateItemButton.disabled = true;
  const deleteItemButton = createToolbarButton(documentRef, "delete-item-button", "Delete");
  deleteItemButton.disabled = true;
  selectionGroup.append(duplicateItemButton, deleteItemButton);

  const historyGroup = createToolbarGroup(documentRef, "History");
  const undoButton = createToolbarButton(documentRef, "undo-button", "Undo");
  undoButton.disabled = true;
  const redoButton = createToolbarButton(documentRef, "redo-button", "Redo");
  redoButton.disabled = true;
  historyGroup.append(undoButton, redoButton);

  const payloadGroup = createToolbarGroup(documentRef, "Payload");
  payloadGroup.append(
    createToolbarButton(documentRef, "format-button", "Format JSON"),
    createToolbarButton(documentRef, "reset-button", "Reset Demo"),
    createToolbarButton(documentRef, "open-import-button", "Import"),
    createToolbarButton(documentRef, "open-export-button", "Export"),
    createToolbarButton(documentRef, "open-theme-button", "Theme")
  );

  toolbar.append(toolGroup, addGroup, selectionGroup, historyGroup, payloadGroup);
  return toolbar;
}

function createToolbarGroup(documentRef: Document, label: string): HTMLElement {
  const group = documentRef.createElement("section");
  group.className = "toolbar-group";
  group.setAttribute("aria-label", label);

  const groupLabel = documentRef.createElement("span");
  groupLabel.className = "toolbar-group-label";
  groupLabel.textContent = label;

  group.append(groupLabel);
  return group;
}

function createToolbarButton(documentRef: Document, className: string, label: string): HTMLButtonElement {
  const button = documentRef.createElement("button");
  button.className = `${className} utility-button`;
  button.type = "button";
  button.textContent = label;
  return button;
}

function createPreviewPane(documentRef: Document): HTMLElement {
  const pane = createPane(documentRef, "Preview");
  const controls = documentRef.createElement("div");
  controls.className = "preview-controls";

  const toggleGridButton = documentRef.createElement("button");
  toggleGridButton.className = "toggle-grid-button utility-button";
  toggleGridButton.type = "button";
  toggleGridButton.textContent = "Grid On";
  toggleGridButton.setAttribute("aria-pressed", "true");

  const gridSizeLabel = documentRef.createElement("label");
  gridSizeLabel.className = "grid-size-field";

  const gridSizeText = documentRef.createElement("span");
  gridSizeText.className = "field-label";
  gridSizeText.textContent = "Grid";

  const gridSizeInput = documentRef.createElement("input");
  gridSizeInput.className = "grid-size-input";
  gridSizeInput.type = "number";
  gridSizeInput.min = "1";
  gridSizeInput.step = "1";
  gridSizeInput.value = String(DEFAULT_EDITOR_GRID_SIZE);

  gridSizeLabel.append(gridSizeText, gridSizeInput);

  const toggleSnapButton = documentRef.createElement("button");
  toggleSnapButton.className = "toggle-snap-button utility-button";
  toggleSnapButton.type = "button";
  toggleSnapButton.textContent = "Snap On";
  toggleSnapButton.setAttribute("aria-pressed", "true");

  const resetViewButton = documentRef.createElement("button");
  resetViewButton.className = "reset-view-button utility-button";
  resetViewButton.type = "button";
  resetViewButton.textContent = "Fit";

  controls.append(toggleGridButton, toggleSnapButton, gridSizeLabel, resetViewButton);
  pane.querySelector(".pane-header")?.append(controls);
  pane.append(createPreviewSurface(documentRef), createPolylineContextMenu(documentRef));
  return pane;
}

function createPolylineContextMenu(documentRef: Document): HTMLElement {
  const menu = documentRef.createElement("div");
  menu.className = "polyline-context-menu";
  menu.hidden = true;

  const addSection = createContextMenuSection(documentRef, "Add", "empty");
  addSection.append(
    createContextMenuButton(documentRef, "add-text-context-button", "Text"),
    createContextMenuButton(documentRef, "add-rect-context-button", "Rect"),
    createContextMenuButton(documentRef, "add-circle-context-button", "Circle"),
    createContextMenuButton(documentRef, "add-polyline-context-button", "Polyline")
  );

  const actionsSection = createContextMenuSection(documentRef, "Actions", "item polyline");
  actionsSection.append(
    createContextMenuButton(documentRef, "context-duplicate-button", "Duplicate"),
    createContextMenuButton(documentRef, "context-delete-button", "Delete")
  );

  const layerSection = createContextMenuSection(documentRef, "Layer", "item polyline");
  layerSection.append(
    createContextMenuButton(documentRef, "bring-forward-button", "Bring forward"),
    createContextMenuButton(documentRef, "send-backward-button", "Send backward"),
    createContextMenuButton(documentRef, "bring-to-front-button", "Bring to front"),
    createContextMenuButton(documentRef, "send-to-back-button", "Send to back")
  );

  const alignSection = createContextMenuSection(documentRef, "Align", "item polyline");
  alignSection.append(
    createContextMenuButton(documentRef, "align-left-button", "Left"),
    createContextMenuButton(documentRef, "align-right-button", "Right"),
    createContextMenuButton(documentRef, "align-top-button", "Top"),
    createContextMenuButton(documentRef, "align-bottom-button", "Bottom"),
    createContextMenuButton(documentRef, "align-center-button", "Center")
  );

  const mirrorSection = createContextMenuSection(documentRef, "Mirror", "item polyline");
  mirrorSection.append(
    createContextMenuButton(documentRef, "mirror-horizontal-button", "Horizontal"),
    createContextMenuButton(documentRef, "mirror-vertical-button", "Vertical")
  );

  const pointSection = createContextMenuSection(documentRef, "Polyline", "polyline");
  pointSection.append(
    createContextMenuButton(documentRef, "add-polyline-point-button", "Add point here"),
    createContextMenuButton(documentRef, "delete-polyline-point-button", "Delete nearest point")
  );

  menu.append(addSection, actionsSection, layerSection, alignSection, mirrorSection, pointSection);
  return menu;
}

function createContextMenuSection(documentRef: Document, label: string, modes: string): HTMLElement {
  const section = documentRef.createElement("section");
  section.className = "context-menu-section";
  section.dataset.contextModes = modes;

  const heading = documentRef.createElement("div");
  heading.className = "context-menu-heading";
  heading.textContent = label;
  section.append(heading);
  return section;
}

function createContextMenuButton(documentRef: Document, className: string, label: string): HTMLButtonElement {
  const button = documentRef.createElement("button");
  button.className = className;
  button.type = "button";
  button.textContent = label;
  return button;
}

function createTransferPanel(documentRef: Document): HTMLElement {
  const wrapper = documentRef.createElement("div");
  wrapper.className = "transfer-panel-wrapper";

  const panel = documentRef.createElement("aside");
  panel.className = "transfer-panel";
  panel.hidden = true;

  const header = documentRef.createElement("div");
  header.className = "transfer-panel-header";

  const title = documentRef.createElement("h2");
  title.className = "transfer-panel-title";
  title.textContent = "Export Payload";

  const closeButton = documentRef.createElement("button");
  closeButton.className = "transfer-panel-close";
  closeButton.type = "button";
  closeButton.textContent = "X";

  header.append(title, closeButton);

  const statusRow = documentRef.createElement("div");
  statusRow.className = "transfer-status-row";
  const status = documentRef.createElement("span");
  status.className = "status";
  status.textContent = "Ready";
  statusRow.append(status);

  const importSection = documentRef.createElement("section");
  importSection.className = "import-section";

  const importLabel = documentRef.createElement("label");
  importLabel.className = "field-label";
  importLabel.textContent = "Import hsc1 payload";

  const importInput = documentRef.createElement("textarea");
  importInput.className = "import-input";
  importInput.placeholder = "Paste hsc1... payload here";
  importInput.spellcheck = false;
  importInput.wrap = "soft";

  const importButton = documentRef.createElement("button");
  importButton.className = "import-button utility-button";
  importButton.type = "button";
  importButton.textContent = "Import";

  const themeSection = documentRef.createElement("section");
  themeSection.className = "theme-section";
  themeSection.hidden = true;

  const themeLabel = documentRef.createElement("label");
  themeLabel.className = "field-label";
  themeLabel.textContent = "Theme preview JSON";

  const themeInput = documentRef.createElement("textarea");
  themeInput.className = "theme-input";
  themeInput.placeholder = "Paste theme variables JSON from Home Assistant";
  themeInput.spellcheck = false;
  themeInput.wrap = "soft";

  const themeControls = documentRef.createElement("div");
  themeControls.className = "theme-controls";

  const applyThemeButton = documentRef.createElement("button");
  applyThemeButton.className = "apply-theme-button utility-button";
  applyThemeButton.type = "button";
  applyThemeButton.textContent = "Apply Theme";

  const themeStatus = documentRef.createElement("span");
  themeStatus.className = "theme-status";
  themeStatus.textContent = "Optional theme preview";

  themeControls.append(applyThemeButton, themeStatus);
  themeSection.append(themeLabel, themeInput, themeControls);

  const exportSection = documentRef.createElement("section");
  exportSection.className = "export-section";

  const exportHeader = documentRef.createElement("div");
  exportHeader.className = "export-section-header";

  const exportLabel = documentRef.createElement("label");
  exportLabel.className = "field-label";
  exportLabel.textContent = "Export hsc1 payload";

  const copyButton = documentRef.createElement("button");
  copyButton.className = "copy-button utility-button";
  copyButton.type = "button";
  copyButton.textContent = "Copy";

  const payloadOutput = documentRef.createElement("textarea");
  payloadOutput.className = "payload-output";
  payloadOutput.readOnly = true;
  payloadOutput.wrap = "soft";

  importSection.append(importLabel, importInput, importButton);
  exportHeader.append(exportLabel, copyButton);
  exportSection.append(exportHeader, payloadOutput);
  panel.append(header, statusRow, importSection, themeSection, exportSection);
  wrapper.append(panel);
  return wrapper;
}

function createPreviewSurface(documentRef: Document): HTMLElement {
  const previewSurface = documentRef.createElement("div");
  previewSurface.className = "preview-surface";
  return previewSurface;
}

function createPane(documentRef: Document, title: string): HTMLElement {
  const pane = documentRef.createElement("section");
  pane.className = "pane";

  const header = documentRef.createElement("div");
  header.className = "pane-header";

  const heading = documentRef.createElement("h1");
  heading.className = "pane-title";
  heading.textContent = title;
  header.append(heading);
  pane.append(header);

  return pane;
}

function getRequiredElement<T extends HTMLElement>(
  root: ParentNode,
  selector: string,
  constructor: { new(): T }
): T {
  const element = root.querySelector(selector);

  if (!(element instanceof constructor)) {
    throw new Error(`Missing required editor element: ${selector}`);
  }

  return element;
}

mountEditorApp();
