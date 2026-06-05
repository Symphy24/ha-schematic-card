import { decodePayload, encodePayload } from "@ha-schematic-card/codec";
import { renderSchematicSvg } from "@ha-schematic-card/renderer";
import {
  isSchematicPayload,
  type SchematicPayload,
  type SchematicItem,
  type SchematicPoint,
  type SchematicStyle,
  type SchematicSymbolDefinition,
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
  activeWorkspace: WorkspaceMode;
  cardWorkspace: HTMLElement;
  workspacePanelLayouts: WorkspacePanelLayouts;
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
  themePreviewToggle: HTMLInputElement;
  transferPanel: HTMLElement;
  transferPanelTitle: HTMLElement;
  importSection: HTMLElement;
  svgImportSection: HTMLElement;
  exportSection: HTMLElement;
  importInput: HTMLTextAreaElement;
  svgImportInput: HTMLTextAreaElement;
  exportOutput: HTMLTextAreaElement;
  status: HTMLElement;
  copyButton: HTMLButtonElement;
  applyThemeButton: HTMLButtonElement;
  openSymbolEditorButton: HTMLButtonElement;
  symbolWorkspace: HTMLElement;
  symbolStartDialog: HTMLElement;
  symbolStartImportButton: HTMLButtonElement;
  symbolStartEditButton: HTMLButtonElement;
  closeSymbolWorkspaceButton: HTMLButtonElement;
  symbolSelectToolButton: HTMLButtonElement;
  symbolPanToolButton: HTMLButtonElement;
  symbolResetViewButton: HTMLButtonElement;
  symbolClearSelectionButton: HTMLButtonElement;
  symbolDeleteItemButton: HTMLButtonElement;
  symbolUndoButton: HTMLButtonElement;
  symbolRedoButton: HTMLButtonElement;
  symbolFileMenuButton: HTMLButtonElement;
  symbolFileMenu: HTMLElement;
  symbolImportDialog: HTMLElement;
  closeSymbolImportDialogButton: HTMLButtonElement;
  cancelSymbolImportButton: HTMLButtonElement;
  createSymbolButton: HTMLButtonElement;
  symbolSelect: HTMLSelectElement;
  symbolPreviewSurface: HTMLElement;
  symbolItemsTabButton: HTMLButtonElement;
  symbolPartsTabButton: HTMLButtonElement;
  symbolSlotsTabButton: HTMLButtonElement;
  symbolPrimaryPanel: HTMLElement;
  symbolDockedPanel: HTMLElement;
  symbolDockedPanelTab: HTMLButtonElement;
  symbolTabDropZone: HTMLElement;
  symbolItemsSection: HTMLElement;
  symbolPartsSection: HTMLElement;
  symbolSlotsSection: HTMLElement;
  symbolItemList: HTMLElement;
  symbolPartsList: HTMLElement;
  symbolSlotsList: HTMLElement;
  symbolInspector: HTMLElement;
  symbolSvgImportInput: HTMLTextAreaElement;
  symbolSvgFileInput: HTMLInputElement;
  symbolSvgDropZone: HTMLElement;
  symbolSvgImportButton: HTMLButtonElement;
  symbolWorkspaceStatus: HTMLElement;
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
  importSvgButton: HTMLButtonElement;
  formatButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
  undoButton: HTMLButtonElement;
  redoButton: HTMLButtonElement;
  selectedItemId?: string;
  selectedItemIds: string[];
  activeSymbolId?: string;
  selectedSymbolInternalItemId?: string;
  selectedSymbolInternalItemIds: string[];
  symbolSimulationStates: Record<string, string>;
  symbolPreviewViewBox?: PreviewViewBox;
  symbolPanMode: boolean;
  symbolPanState?: PreviewPanState;
  symbolDragState?: SymbolDragState;
  symbolSelectionRectState?: SelectionRectState;
  symbolSelectionRectSuppressNextClick?: boolean;
  symbolWorkspaceStarted: boolean;
  gridEnabled: boolean;
  snapEnabled: boolean;
  gridSize: number;
  panMode: boolean;
  previewViewBox?: PreviewViewBox;
  activeTab: EditorTabName;
  activeSymbolTab: SymbolEditorTabName;
  dockedTab?: EditorTabName;
  draggedTab?: EditorTabName;
  dockedSymbolTab?: SymbolEditorTabName;
  draggedSymbolTab?: SymbolEditorTabName;
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
type SymbolEditorTabName = "items" | "parts" | "slots";
type WorkspaceMode = "card" | "symbol";
type FloatingPanelId = "items" | "inspector" | "json" | "transfer";
type FloatingPanelDockZone = "left" | "right" | "bottom";
type FloatingPanelSnapZone = "fullscreen" | "left" | "right" | "bottom";
type FloatingPanelResizeMode = "floating" | "dock-zone";
type TransferPanelMode = "import" | "svg" | "export" | "theme";

type FloatingPanelStyleSnapshot = {
  left: string;
  top: string;
  right: string;
  bottom: string;
  width: string;
  height: string;
  maxHeight: string;
  zIndex: string;
};

type FloatingPanelLayoutSnapshot = {
  dockRatio?: number;
  dockSize?: number;
  dockZone?: FloatingPanelDockZone;
  hidden: boolean;
  order: number;
  panelState: string;
  style: FloatingPanelStyleSnapshot;
};

type WorkspacePanelLayouts = Record<WorkspaceMode, Partial<Record<FloatingPanelId, FloatingPanelLayoutSnapshot>>>;

type FloatingPanelDragState = {
  panel: HTMLElement;
  layer: HTMLElement;
  startClientX: number;
  startClientY: number;
  startLeft: number;
  startTop: number;
  moved: boolean;
  pointerOffsetX: number;
  pointerOffsetY: number;
  wasDocked: boolean;
};

type FloatingPanelResizeState = {
  panel: HTMLElement;
  layer: HTMLElement;
  mode: FloatingPanelResizeMode;
  edges: FloatingPanelResizeEdges;
  startClientX: number;
  startClientY: number;
  startWidth: number;
  startHeight: number;
  startLeft: number;
  startTop: number;
  dockZone?: FloatingPanelDockZone;
  dockTarget?: HTMLElement;
};

type FloatingPanelResizeEdges = {
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
};

type FloatingPanelSnapTarget = {
  accepted: boolean;
  index?: number;
  rect: { left: number; top: number; width: number; height: number };
  zone: FloatingPanelSnapZone;
};

type SideDockDividerResizeState = {
  target: HTMLElement;
  dividerIndex: number;
  startClientY: number;
  startRatios: number[];
  dockHeight: number;
};

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

type SvgImportResult =
  | { ok: true; items: SchematicItem[]; warnings: string[] }
  | { ok: false; errors: string[] };

type SvgImportContext = {
  existingIds: Set<string>;
  classStyles: Map<string, SchematicStyle>;
  warnings: string[];
};

type SymbolInternalItemEntry = {
  item: SchematicItem;
  depth: number;
};

type SymbolSlotValueType = NonNullable<NonNullable<SchematicSymbolDefinition["entitySlots"]>[number]["valueType"]>;

type StyleSliderConfig = {
  min: number;
  max: number;
  step: number;
  fallback: number;
};

const UNSAFE_SVG_TAGS = new Set([
  "script",
  "style",
  "foreignobject",
  "iframe",
  "html",
  "body",
  "head",
  "object",
  "embed",
  "image",
  "a",
  "use"
]);

const SUPPORTED_SVG_IMPORT_TAGS = new Set([
  "svg",
  "g",
  "rect",
  "circle",
  "line",
  "polyline",
  "polygon",
  "path",
  "text"
]);

const SAFE_SVG_STYLE_ATTRIBUTES = new Set([
  "stroke",
  "stroke-width",
  "stroke-dasharray",
  "fill",
  "opacity",
  "font-size",
  "font-weight",
  "text-anchor"
]);

const THEME_TOKEN_PRESETS: ThemeTokenPreset[] = [
  { label: "primary text", value: "var(--primary-text-color)" },
  { label: "secondary text", value: "var(--secondary-text-color)" },
  { label: "accent", value: "var(--accent-color)" },
  { label: "error", value: "var(--error-color)" },
  { label: "warning", value: "var(--warning-color)" },
  { label: "success", value: "var(--success-color)" },
  { label: "divider", value: "var(--divider-color)" }
];

const FLOATING_PANEL_MIN_WIDTH = 260;
const FLOATING_PANEL_MIN_HEIGHT = 160;
const FLOATING_PANEL_DOCK_RESERVE = 56;
const FLOATING_PANEL_RESIZE_EDGE_PX = 7;
const FLOATING_PANEL_UNDOCK_PX = 24;
const FLOATING_PANEL_SIDE_STACK_LIMIT = 3;
const FLOATING_PANEL_SIDE_MIN_RATIO = 0.18;
const ODYSSEUS_FULLSCREEN_SNAP_PX = 8;
const ODYSSEUS_EDGE_SNAP_PX = 60;
const ODYSSEUS_BOTTOM_SNAP_PX = 24;
const SNAP_TOUR_HINT_STORAGE_KEY = "hsc-odysseus-hint-drag-to-snap-seen";
const FLOATING_PANEL_IDS: FloatingPanelId[] = ["items", "inspector", "json", "transfer"];

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
  strokeWidth: "Line width in SVG units. Fill-only shapes need a stroke color before stroke width is visible.",
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
  selectedSymbolInternalItemId?: string;
  selectedSymbolInternalItemIds?: string[];
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

type SymbolDragState = {
  itemId: string;
  startPoint: SchematicPoint;
  startItems: Array<{ itemId: string; item: SchematicItem }>;
  coordinateSpace: SvgCoordinateSpace;
  historyRecorded: boolean;
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
  shell.dataset.sidebar = "collapsed";
  shell.dataset.workspace = "card";
  shell.tabIndex = -1;

  const rail = createEditorRail(documentRef);
  const toolbar = createGlobalToolbar(documentRef);
  const jsonPane = createJsonPane(documentRef);
  const previewPane = createPreviewPane(documentRef);
  previewPane.classList.add("card-editor-workspace");
  previewPane.querySelector(".pane-header")?.append(toolbar);
  const workspace = documentRef.createElement("div");
  workspace.className = "editor-workspace";
  const editorMain = documentRef.createElement("div");
  editorMain.className = "editor-main";
  const transferPanel = createTransferPanel(documentRef);
  const symbolWorkspace = createSymbolEditorWorkspace(documentRef);
  symbolWorkspace.hidden = true;

  const elements: EditorElements = {
    editorRoot: shell,
    activeWorkspace: "card",
    cardWorkspace: previewPane,
    workspacePanelLayouts: { card: {}, symbol: {} },
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
    themePreviewToggle: getRequiredElement(transferPanel, ".theme-preview-toggle", HTMLInputElement),
    transferPanel: getRequiredElement(transferPanel, ".transfer-panel", HTMLElement),
    transferPanelTitle: getRequiredElement(transferPanel, ".transfer-panel-title", HTMLElement),
    importSection: getRequiredElement(transferPanel, ".import-section", HTMLElement),
    svgImportSection: getRequiredElement(transferPanel, ".svg-import-section", HTMLElement),
    exportSection: getRequiredElement(transferPanel, ".export-section", HTMLElement),
    importInput: getRequiredElement(transferPanel, ".import-input", HTMLTextAreaElement),
    svgImportInput: getRequiredElement(transferPanel, ".svg-import-input", HTMLTextAreaElement),
    exportOutput: getRequiredElement(transferPanel, ".payload-output", HTMLTextAreaElement),
    status: getRequiredElement(transferPanel, ".status", HTMLElement),
    copyButton: getRequiredElement(transferPanel, ".copy-button", HTMLButtonElement),
    applyThemeButton: getRequiredElement(transferPanel, ".apply-theme-button", HTMLButtonElement),
    openSymbolEditorButton: getRequiredElement(rail, ".open-symbol-editor-button", HTMLButtonElement),
    symbolWorkspace,
    symbolStartDialog: getRequiredElement(symbolWorkspace, ".symbol-start-dialog", HTMLElement),
    symbolStartImportButton: getRequiredElement(symbolWorkspace, ".symbol-start-import-button", HTMLButtonElement),
    symbolStartEditButton: getRequiredElement(symbolWorkspace, ".symbol-start-edit-button", HTMLButtonElement),
    closeSymbolWorkspaceButton: getRequiredElement(symbolWorkspace, ".close-symbol-workspace-button", HTMLButtonElement),
    symbolSelectToolButton: getRequiredElement(symbolWorkspace, ".symbol-select-tool-button", HTMLButtonElement),
    symbolPanToolButton: getRequiredElement(symbolWorkspace, ".symbol-pan-tool-button", HTMLButtonElement),
    symbolResetViewButton: getRequiredElement(symbolWorkspace, ".symbol-reset-view-button", HTMLButtonElement),
    symbolClearSelectionButton: getRequiredElement(symbolWorkspace, ".symbol-clear-selection-button", HTMLButtonElement),
    symbolDeleteItemButton: getRequiredElement(symbolWorkspace, ".symbol-delete-item-button", HTMLButtonElement),
    symbolUndoButton: getRequiredElement(symbolWorkspace, ".symbol-undo-button", HTMLButtonElement),
    symbolRedoButton: getRequiredElement(symbolWorkspace, ".symbol-redo-button", HTMLButtonElement),
    symbolFileMenuButton: getRequiredElement(symbolWorkspace, ".symbol-file-menu-button", HTMLButtonElement),
    symbolFileMenu: getRequiredElement(symbolWorkspace, ".symbol-file-menu", HTMLElement),
    symbolImportDialog: getRequiredElement(symbolWorkspace, ".symbol-import-dialog", HTMLElement),
    closeSymbolImportDialogButton: getRequiredElement(symbolWorkspace, ".close-symbol-import-dialog-button", HTMLButtonElement),
    cancelSymbolImportButton: getRequiredElement(symbolWorkspace, ".cancel-symbol-import-button", HTMLButtonElement),
    createSymbolButton: getRequiredElement(symbolWorkspace, ".create-symbol-button", HTMLButtonElement),
    symbolSelect: getRequiredElement(symbolWorkspace, ".symbol-select", HTMLSelectElement),
    symbolPreviewSurface: getRequiredElement(symbolWorkspace, ".symbol-preview-surface", HTMLElement),
    symbolItemsTabButton: getRequiredElement(symbolWorkspace, ".symbol-items-tab-button", HTMLButtonElement),
    symbolPartsTabButton: getRequiredElement(symbolWorkspace, ".symbol-parts-tab-button", HTMLButtonElement),
    symbolSlotsTabButton: getRequiredElement(symbolWorkspace, ".symbol-slots-tab-button", HTMLButtonElement),
    symbolPrimaryPanel: getRequiredElement(symbolWorkspace, ".symbol-primary-panel", HTMLElement),
    symbolDockedPanel: getRequiredElement(symbolWorkspace, ".symbol-docked-panel", HTMLElement),
    symbolDockedPanelTab: getRequiredElement(symbolWorkspace, ".symbol-docked-panel-tab", HTMLButtonElement),
    symbolTabDropZone: getRequiredElement(symbolWorkspace, ".symbol-tab-drop-zone", HTMLElement),
    symbolItemsSection: getRequiredElement(symbolWorkspace, ".symbol-items-section", HTMLElement),
    symbolPartsSection: getRequiredElement(symbolWorkspace, ".symbol-parts-section", HTMLElement),
    symbolSlotsSection: getRequiredElement(symbolWorkspace, ".symbol-slots-section", HTMLElement),
    symbolItemList: getRequiredElement(symbolWorkspace, ".symbol-internal-item-list", HTMLElement),
    symbolPartsList: getRequiredElement(symbolWorkspace, ".symbol-parts-list", HTMLElement),
    symbolSlotsList: getRequiredElement(symbolWorkspace, ".symbol-slots-list", HTMLElement),
    symbolInspector: getRequiredElement(symbolWorkspace, ".symbol-editor-inspector", HTMLElement),
    symbolSvgImportInput: getRequiredElement(symbolWorkspace, ".symbol-svg-import-input", HTMLTextAreaElement),
    symbolSvgFileInput: getRequiredElement(symbolWorkspace, ".symbol-svg-file-input", HTMLInputElement),
    symbolSvgDropZone: getRequiredElement(symbolWorkspace, ".symbol-svg-drop-zone", HTMLElement),
    symbolSvgImportButton: getRequiredElement(symbolWorkspace, ".symbol-svg-import-button", HTMLButtonElement),
    symbolWorkspaceStatus: getRequiredElement(symbolWorkspace, ".symbol-workspace-status", HTMLElement),
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
    importSvgButton: getRequiredElement(transferPanel, ".import-svg-button", HTMLButtonElement),
    formatButton: getRequiredElement(jsonPane, ".format-button", HTMLButtonElement),
    resetButton: getRequiredElement(jsonPane, ".reset-button", HTMLButtonElement),
    undoButton: getRequiredElement(toolbar, ".undo-button", HTMLButtonElement),
    redoButton: getRequiredElement(toolbar, ".redo-button", HTMLButtonElement),
    selectedItemIds: [],
    selectedSymbolInternalItemIds: [],
    gridEnabled: true,
    snapEnabled: true,
    gridSize: DEFAULT_EDITOR_GRID_SIZE,
    panMode: false,
    activeTab: "items",
    activeSymbolTab: "items",
    symbolSimulationStates: {},
    symbolPanMode: false,
    symbolWorkspaceStarted: false,
    undoStack: [],
    redoStack: []
  };

  elements.jsonInput.value = formatPayloadJson();
  loadStoredThemePreview(elements);
  elements.jsonInput.addEventListener("input", () => updateFromJson(elements, documentRef));
  elements.copyButton.addEventListener("click", async () => copyExportedPayload(elements));
  elements.applyThemeButton.addEventListener("click", () => applyThemePreview(elements));
  elements.themePreviewToggle.addEventListener("change", () => updateThemePreviewMode(elements));
  elements.closeSymbolWorkspaceButton.addEventListener("click", () => closeSymbolWorkspace(elements));
  elements.symbolStartImportButton.addEventListener("click", () => startSymbolWorkspaceWithImport(elements, documentRef));
  elements.symbolStartEditButton.addEventListener("click", () => startSymbolWorkspaceWithExistingSymbol(elements, documentRef));
  elements.symbolSelectToolButton.addEventListener("click", () => toggleSymbolPanMode(elements, false));
  elements.symbolPanToolButton.addEventListener("click", () => toggleSymbolPanMode(elements, true));
  elements.symbolResetViewButton.addEventListener("click", () => resetSymbolPreviewView(elements));
  elements.symbolClearSelectionButton.addEventListener("click", () => clearSymbolSelection(elements, documentRef));
  elements.symbolDeleteItemButton.addEventListener("click", () => deleteSelectedSymbolInternalItem(elements, documentRef));
  elements.symbolUndoButton.addEventListener("click", () => undoEditorChange(elements, documentRef));
  elements.symbolRedoButton.addEventListener("click", () => redoEditorChange(elements, documentRef));
  elements.symbolFileMenuButton.addEventListener("click", () => toggleSymbolFileMenu(elements));
  elements.createSymbolButton.addEventListener("click", () => createSymbolFromWorkspace(elements, documentRef));
  elements.symbolSvgImportButton.addEventListener("click", () => importSvgIntoSelectedSymbol(elements, documentRef));
  elements.closeSymbolImportDialogButton.addEventListener("click", () => closeSymbolImportDialog(elements));
  elements.cancelSymbolImportButton.addEventListener("click", () => closeSymbolImportDialog(elements));
  elements.symbolSvgFileInput.addEventListener("change", () => readSelectedSymbolSvgFile(elements));
  setupSymbolSvgDropZone(elements);
  elements.symbolSelect.addEventListener("change", () => {
    elements.activeSymbolId = elements.symbolSelect.value || undefined;
    setSelectedSymbolInternalItems(elements, []);
    delete elements.symbolPreviewViewBox;
    renderSymbolWorkspace(elements, documentRef);
  });
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
  elements.importSvgButton.addEventListener("click", () => importSvgMarkup(elements, documentRef));
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
  elements.symbolItemsTabButton.addEventListener("click", () => showSymbolEditorTab(elements, "items"));
  elements.symbolPartsTabButton.addEventListener("click", () => showSymbolEditorTab(elements, "parts"));
  elements.symbolSlotsTabButton.addEventListener("click", () => showSymbolEditorTab(elements, "slots"));
  setupSymbolEditorTabDocking(elements);
  for (const button of Array.from(symbolWorkspace.querySelectorAll<HTMLButtonElement>("[data-symbol-panel-shortcut]"))) {
    button.addEventListener("click", () => showSymbolEditorTab(elements, getSymbolPanelShortcut(button)));
  }
  shell.addEventListener("keydown", (event) => handleEditorKeyDown(elements, event, documentRef));

  const sidebarToggleButton = getRequiredElement(rail, ".sidebar-toggle-button", HTMLButtonElement);
  sidebarToggleButton.addEventListener("click", () => toggleEditorSidebar(shell, sidebarToggleButton));

  const floatingPanelLayer = createFloatingPanelLayer(documentRef, {
    itemListSection: elements.itemListSection,
    inspectorSection: elements.inspectorSection,
    jsonSection: elements.jsonSection,
    transferPanel: elements.transferPanel
  });

  editorMain.append(previewPane, symbolWorkspace);
  workspace.append(editorMain, floatingPanelLayer);
  shell.append(rail, workspace);
  setupFloatingPanels(elements, documentRef);
  updateFromJson(elements, documentRef);
  elements.workspacePanelLayouts.card = captureFloatingPanelLayout(shell);
  elements.workspacePanelLayouts.symbol = createClosedFloatingPanelLayout(shell);
  updateWorkspaceNavigationState(elements);

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
    selectedItemIds: [...elements.selectedItemIds],
    selectedSymbolInternalItemId: elements.selectedSymbolInternalItemId,
    selectedSymbolInternalItemIds: [...elements.selectedSymbolInternalItemIds]
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
  setSelectedSymbolInternalItems(
    elements,
    snapshot.selectedSymbolInternalItemIds ?? (snapshot.selectedSymbolInternalItemId ? [snapshot.selectedSymbolInternalItemId] : []),
    snapshot.selectedSymbolInternalItemId
  );
  delete elements.dragState;
  delete elements.pointDragState;
  delete elements.drawState;
  delete elements.symbolDragState;
  delete elements.symbolSelectionRectState;
  closePolylineContextMenu(elements);
  updateDrawControls(elements);
  updateFromJson(elements, documentRef);
  updateHistoryControls(elements);
}

function updateHistoryControls(elements: EditorElements): void {
  elements.undoButton.disabled = elements.undoStack.length === 0;
  elements.redoButton.disabled = elements.redoStack.length === 0;
  elements.symbolUndoButton.disabled = elements.undoStack.length === 0;
  elements.symbolRedoButton.disabled = elements.redoStack.length === 0;
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
  openFloatingPanel(elements.editorRoot, getEditorTabPanelId(tab));
  queueSnapTourHint(elements.editorRoot, getFloatingPanel(elements.editorRoot, getEditorTabPanelId(tab)), elements.editorRoot.ownerDocument);
  updateEditorTabs(elements);

  if (tab === "json") {
    selectSelectedItemInJson(elements);
  }
}

function getEditorTabPanelId(tab: EditorTabName): FloatingPanelId {
  switch (tab) {
    case "items":
      return "items";
    case "inspector":
      return "inspector";
    case "json":
      return "json";
  }
}

function togglePreviewGrid(elements: EditorElements, documentRef: Document): void {
  elements.gridEnabled = !elements.gridEnabled;
  elements.toggleGridButton.setAttribute("aria-pressed", String(elements.gridEnabled));
  elements.toggleGridButton.title = elements.gridEnabled ? "Grid on" : "Grid off";
  elements.toggleGridButton.setAttribute("aria-label", elements.gridEnabled ? "Grid on" : "Grid off");
  updateFromJson(elements, documentRef);
}

function toggleSnap(elements: EditorElements): void {
  elements.snapEnabled = !elements.snapEnabled;
  elements.toggleSnapButton.setAttribute("aria-pressed", String(elements.snapEnabled));
  elements.toggleSnapButton.title = elements.snapEnabled ? "Snap on" : "Snap off";
  elements.toggleSnapButton.setAttribute("aria-label", elements.snapEnabled ? "Snap on" : "Snap off");
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
  elements.panToolButton.textContent = "✥";
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
    const floatingPanel = sections[tab].closest(".floating-panel");

    if (floatingPanel) {
      sections[tab].hidden = false;
    } else if (docked && sections[tab].parentElement !== elements.dockedPanel) {
      elements.dockedPanel.append(sections[tab]);
    } else if (!docked && sections[tab].parentElement !== elements.primaryPanel) {
      elements.primaryPanel.append(sections[tab]);
    }

    if (!floatingPanel) {
      sections[tab].hidden = !active && !docked;
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

function showSymbolEditorTab(elements: EditorElements, tab: SymbolEditorTabName): void {
  if (elements.dockedSymbolTab === tab) {
    undockSymbolEditorTab(elements, tab);
  }

  elements.activeSymbolTab = tab;
  updateSymbolEditorTabs(elements);
}

function updateSymbolEditorTabs(elements: EditorElements): void {
  const tabs: SymbolEditorTabName[] = ["items", "parts", "slots"];
  const buttons = {
    items: elements.symbolItemsTabButton,
    parts: elements.symbolPartsTabButton,
    slots: elements.symbolSlotsTabButton
  };
  const sections = {
    items: elements.symbolItemsSection,
    parts: elements.symbolPartsSection,
    slots: elements.symbolSlotsSection
  };

  for (const tab of tabs) {
    const active = elements.activeSymbolTab === tab;
    const docked = elements.dockedSymbolTab === tab;
    buttons[tab].setAttribute("aria-selected", String(active));
    buttons[tab].dataset.docked = String(docked);
    sections[tab].hidden = !active && !docked;

    if (docked && sections[tab].parentElement !== elements.symbolDockedPanel) {
      elements.symbolDockedPanel.append(sections[tab]);
    } else if (!docked && sections[tab].parentElement !== elements.symbolPrimaryPanel) {
      elements.symbolPrimaryPanel.append(sections[tab]);
    }
  }

  elements.symbolDockedPanel.hidden = elements.dockedSymbolTab === undefined;
  elements.symbolDockedPanelTab.hidden = elements.dockedSymbolTab === undefined;
  elements.symbolDockedPanelTab.textContent = elements.dockedSymbolTab ? getSymbolEditorTabLabel(elements.dockedSymbolTab) : "";
  elements.symbolDockedPanelTab.dataset.symbolTab = elements.dockedSymbolTab;
}

function setupSymbolEditorTabDocking(elements: EditorElements): void {
  for (const button of [elements.symbolItemsTabButton, elements.symbolPartsTabButton, elements.symbolSlotsTabButton]) {
    button.draggable = true;
    button.addEventListener("dragstart", (event) => {
      elements.draggedSymbolTab = getSymbolTabNameFromButton(button);
      event.dataTransfer?.setData("text/plain", elements.draggedSymbolTab);
    });
    button.addEventListener("dragend", () => {
      delete elements.draggedSymbolTab;
      elements.symbolTabDropZone.dataset.dropTarget = "false";
    });
  }

  elements.symbolDockedPanelTab.draggable = true;
  elements.symbolDockedPanelTab.addEventListener("dragstart", (event) => {
    if (!elements.dockedSymbolTab) {
      return;
    }

    elements.draggedSymbolTab = elements.dockedSymbolTab;
    event.dataTransfer?.setData("text/plain", elements.draggedSymbolTab);
  });
  elements.symbolDockedPanelTab.addEventListener("dragend", () => {
    delete elements.draggedSymbolTab;
    elements.symbolTabDropZone.dataset.dropTarget = "false";
  });

  elements.symbolTabDropZone.addEventListener("dragover", (event) => {
    if (!elements.draggedSymbolTab || elements.draggedSymbolTab === elements.dockedSymbolTab) {
      return;
    }

    event.preventDefault();
    elements.symbolTabDropZone.dataset.dropTarget = "true";
  });
  elements.symbolTabDropZone.addEventListener("dragleave", () => {
    elements.symbolTabDropZone.dataset.dropTarget = "false";
  });
  elements.symbolTabDropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    const tab = elements.draggedSymbolTab;
    elements.symbolTabDropZone.dataset.dropTarget = "false";

    if (!tab || tab === elements.dockedSymbolTab) {
      return;
    }

    dockSymbolEditorTab(elements, tab);
  });

  const tabRow = elements.symbolItemsTabButton.parentElement;
  tabRow?.addEventListener("dragover", (event) => {
    if (elements.draggedSymbolTab && elements.draggedSymbolTab === elements.dockedSymbolTab) {
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

    if (elements.draggedSymbolTab) {
      undockSymbolEditorTab(elements, elements.draggedSymbolTab);
    }
  });

  updateSymbolEditorTabs(elements);
}

function getSymbolTabNameFromButton(button: HTMLButtonElement): SymbolEditorTabName {
  const tab = button.dataset.symbolTab;
  return tab === "parts" || tab === "slots" ? tab : "items";
}

function getSymbolEditorTabLabel(tab: SymbolEditorTabName): string {
  switch (tab) {
    case "items":
      return "Items";
    case "parts":
      return "Parts";
    case "slots":
      return "Entity Slots";
  }
}

function dockSymbolEditorTab(elements: EditorElements, tab: SymbolEditorTabName): void {
  if (elements.dockedSymbolTab && elements.dockedSymbolTab !== tab) {
    undockSymbolEditorTab(elements, elements.dockedSymbolTab);
  }

  elements.dockedSymbolTab = tab;

  if (elements.activeSymbolTab === tab) {
    elements.activeSymbolTab = tab === "items" ? "parts" : "items";
  }

  updateSymbolEditorTabs(elements);
}

function undockSymbolEditorTab(elements: EditorElements, tab: SymbolEditorTabName): void {
  if (elements.dockedSymbolTab !== tab) {
    return;
  }

  delete elements.dockedSymbolTab;
  elements.activeSymbolTab = tab;
  updateSymbolEditorTabs(elements);
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
      return applyBoundsTransform(getBoundsFromItems(item.children), item.transform);
    case "path":
      return undefined;
  }
}

function applyBoundsTransform(bounds: PreviewViewBox | undefined, transform: SchematicItem["transform"]): PreviewViewBox | undefined {
  if (!bounds || !transform || transform.length === 0) {
    return bounds;
  }

  let x = bounds.x;
  let y = bounds.y;
  let width = bounds.width;
  let height = bounds.height;

  for (const entry of transform) {
    if (entry.type === "translate") {
      x += entry.x;
      y += entry.y;
    } else if (entry.type === "scale") {
      const scaleY = entry.y ?? entry.x;
      x *= entry.x;
      y *= scaleY;
      width *= Math.abs(entry.x);
      height *= Math.abs(scaleY);
    }
  }

  return { x, y, width, height };
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

function setSelectedSymbolInternalItems(elements: EditorElements, itemIds: string[], primaryItemId?: string): void {
  elements.selectedSymbolInternalItemIds = itemIds.filter((itemId, index, ids) => ids.indexOf(itemId) === index);
  elements.selectedSymbolInternalItemId = primaryItemId && elements.selectedSymbolInternalItemIds.includes(primaryItemId)
    ? primaryItemId
    : elements.selectedSymbolInternalItemIds[0];
}

function toggleSelectedSymbolInternalItem(elements: EditorElements, itemId: string): void {
  if (elements.selectedSymbolInternalItemIds.includes(itemId)) {
    setSelectedSymbolInternalItems(
      elements,
      elements.selectedSymbolInternalItemIds.filter((selectedItemId) => selectedItemId !== itemId)
    );
    return;
  }

  setSelectedSymbolInternalItems(elements, [...elements.selectedSymbolInternalItemIds, itemId], itemId);
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
  elements.drawPolylineButton.textContent = drawing ? "×" : "⌁";
  elements.drawPolylineButton.title = drawing ? "Cancel polyline" : "Polyline";
  elements.drawPolylineButton.setAttribute("aria-label", drawing ? "Cancel polyline" : "Polyline");
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
      const itemIds = getSymbolPartItemIds(definition, part.id);
      return itemIds.length > 0
        ? `${label} (${itemIds.join(", ")})`
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
  section.append(createSymbolMetadataGroup(
    documentRef,
    "Part dynamic styles",
    definition.partStyles?.map((entry) => (
      `${entry.partId} when ${entry.when.entityId} = ${entry.when.equals}`
    )) ?? []
  ));
  section.append(createSymbolMetadataGroup(
    documentRef,
    "Part animations",
    definition.partAnimations?.map((entry) => (
      `${entry.partId} ${entry.preset} when ${entry.when.entityId} = ${entry.when.equals}`
    )) ?? []
  ));
  appendSymbolSlotBindingEditor(elements, documentRef, item, definition, section);

  elements.inspector.append(section);
}

function getSymbolPartItemIds(
  definition: NonNullable<SchematicPayload["symbols"]>[number],
  partId: string
): string[] {
  const explicitItems = definition.items
    .filter((item) => item.partId === partId)
    .map((item) => item.id);

  if (explicitItems.length > 0) {
    return explicitItems;
  }

  return definition.parts?.find((part) => part.id === partId)?.itemIds ?? [];
}

function appendSymbolSlotBindingEditor(
  elements: EditorElements,
  documentRef: Document,
  item: Extract<SchematicItem, { type: "symbol" }>,
  definition: NonNullable<SchematicPayload["symbols"]>[number],
  section: HTMLElement
): void {
  const slots = definition.entitySlots ?? [];

  if (slots.length === 0) {
    return;
  }

  const group = documentRef.createElement("div");
  group.className = "symbol-slot-bindings";

  const title = documentRef.createElement("div");
  title.className = "symbol-inspector-group-title";
  title.textContent = "Instance entity bindings";
  group.append(title);

  for (const slot of slots) {
    const label = documentRef.createElement("label");
    label.className = "inspector-field symbol-slot-binding-field";
    label.dataset.slotId = slot.id;

    const labelText = documentRef.createElement("span");
    labelText.className = "field-label";
    labelText.textContent = slot.label ? `${slot.id} - ${slot.label}` : slot.id;

    const input = documentRef.createElement("input");
    input.className = "inspector-input symbol-slot-binding-input";
    input.type = "text";
    input.placeholder = "sensor.example_entity";
    input.value = item.slotBindings?.[slot.id] ?? "";
    input.addEventListener("change", () => {
      updateSelectedSymbolSlotBinding(elements, slot.id, input.value, documentRef);
    });

    const helper = documentRef.createElement("span");
    helper.className = "field-helper";
    helper.textContent = slot.description ?? "Bind this generic symbol slot to a Home Assistant entity id.";

    label.append(labelText, input, helper);
    group.append(label);
  }

  section.append(group);
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

function updateSelectedSymbolSlotBinding(
  elements: EditorElements,
  slotId: string,
  rawValue: string,
  documentRef: Document
): void {
  const result = parseAndValidatePayload(elements.jsonInput.value);

  if (!result.ok) {
    renderDisabledItemTools(elements, result.message);
    return;
  }

  const item = result.payload.items.find((candidate) => candidate.id === elements.selectedItemId);

  if (!item || item.type !== "symbol") {
    elements.inspectorStatus.textContent = "Selected symbol was not found";
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  const value = rawValue.trim();
  const currentValue = item.slotBindings?.[slotId] ?? "";

  if (currentValue === value) {
    return;
  }

  recordHistory(elements);

  if (value.length === 0) {
    const nextBindings = { ...(item.slotBindings ?? {}) };
    delete nextBindings[slotId];

    if (Object.keys(nextBindings).length === 0) {
      delete item.slotBindings;
    } else {
      item.slotBindings = nextBindings;
    }
  } else {
    item.slotBindings = {
      ...(item.slotBindings ?? {}),
      [slotId]: value
    };
  }

  elements.jsonInput.value = formatPayloadJson(result.payload);
  updateFromJson(elements, documentRef);
  elements.inspectorStatus.textContent = `Updated ${slotId} binding for ${item.id}`;
  elements.inspectorStatus.dataset.state = "valid";
}

function openSymbolWorkspace(elements: EditorElements, documentRef: Document): void {
  switchEditorWorkspace(elements, "symbol", documentRef);
}

function ensureSymbolWorkspaceOpen(elements: EditorElements, documentRef: Document): void {
  elements.symbolWorkspace.hidden = false;
  if (!elements.symbolWorkspaceStarted) {
    renderSymbolWorkspaceStart(elements, documentRef);
    return;
  }

  renderSymbolWorkspace(elements, documentRef);
}

function closeSymbolWorkspace(elements: EditorElements): void {
  switchEditorWorkspace(elements, "card", elements.editorRoot.ownerDocument);
}

function renderSymbolWorkspaceStart(elements: EditorElements, documentRef: Document): void {
  elements.symbolStartDialog.hidden = false;
  const result = parseAndValidatePayload(elements.jsonInput.value);
  renderSymbolOptions(elements, result.ok ? result.payload.symbols ?? [] : [], documentRef);
  renderEmptySymbolWorkspace(elements, "Choose how to start");
}

function startSymbolWorkspaceWithExistingSymbol(elements: EditorElements, documentRef: Document): void {
  elements.symbolWorkspaceStarted = true;
  elements.symbolStartDialog.hidden = true;
  renderSymbolWorkspace(elements, documentRef);
}

function startSymbolWorkspaceWithImport(elements: EditorElements, documentRef: Document): void {
  const result = parseAndValidatePayload(elements.jsonInput.value);

  if (!result.ok) {
    renderSymbolWorkspaceError(elements, result.message);
    return;
  }

  const symbol = createEmptySymbolDefinition(result.payload);
  recordHistory(elements);
  result.payload.symbols = [...(result.payload.symbols ?? []), symbol];
  elements.activeSymbolId = symbol.id;
  setSelectedSymbolInternalItems(elements, []);
  elements.jsonInput.value = formatPayloadJson(result.payload);
  updateFromJson(elements, documentRef);
  elements.symbolWorkspaceStarted = true;
  elements.symbolStartDialog.hidden = true;
  renderSymbolWorkspace(elements, documentRef);
  openSymbolImportDialog(elements.symbolWorkspace);
}

function toggleSymbolFileMenu(elements: EditorElements): void {
  elements.symbolFileMenu.hidden = !elements.symbolFileMenu.hidden;
  elements.symbolFileMenuButton.setAttribute("aria-expanded", String(!elements.symbolFileMenu.hidden));
}

function openSymbolImportDialog(root: ParentNode): void {
  const dialog = root.querySelector<HTMLElement>(".symbol-import-dialog");

  if (dialog) {
    dialog.hidden = false;
  }
}

function closeSymbolImportDialog(elements: EditorElements): void {
  elements.symbolImportDialog.hidden = true;
  elements.symbolFileMenu.hidden = true;
  elements.symbolFileMenuButton.setAttribute("aria-expanded", "false");
}

function setupSymbolSvgDropZone(elements: EditorElements): void {
  elements.symbolSvgDropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    elements.symbolSvgDropZone.dataset.dragging = "true";
  });
  elements.symbolSvgDropZone.addEventListener("dragleave", () => {
    delete elements.symbolSvgDropZone.dataset.dragging;
  });
  elements.symbolSvgDropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    delete elements.symbolSvgDropZone.dataset.dragging;
    const file = event.dataTransfer?.files[0];

    if (file) {
      readSymbolSvgFile(elements, file);
    }
  });
}

function readSelectedSymbolSvgFile(elements: EditorElements): void {
  const file = elements.symbolSvgFileInput.files?.[0];

  if (file) {
    readSymbolSvgFile(elements, file);
  }
}

function readSymbolSvgFile(elements: EditorElements, file: File): void {
  if (!file.name.toLowerCase().endsWith(".svg") && file.type !== "image/svg+xml") {
    elements.symbolWorkspaceStatus.textContent = "Choose an .svg file.";
    elements.symbolWorkspaceStatus.dataset.state = "error";
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    elements.symbolSvgImportInput.value = typeof reader.result === "string" ? reader.result : "";
    elements.symbolWorkspaceStatus.textContent = `Loaded ${file.name}`;
    elements.symbolWorkspaceStatus.dataset.state = "valid";
  });
  reader.addEventListener("error", () => {
    elements.symbolWorkspaceStatus.textContent = "Could not read SVG file.";
    elements.symbolWorkspaceStatus.dataset.state = "error";
  });
  reader.readAsText(file);
}

function createSymbolFromWorkspace(elements: EditorElements, documentRef: Document): void {
  const result = parseAndValidatePayload(elements.jsonInput.value);

  if (!result.ok) {
    renderSymbolWorkspaceError(elements, result.message);
    return;
  }

  const symbol = createDefaultSymbolDefinition(result.payload);
  recordHistory(elements);
  result.payload.symbols = [...(result.payload.symbols ?? []), symbol];
  elements.activeSymbolId = symbol.id;
  setSelectedSymbolInternalItems(elements, symbol.items[0] ? [symbol.items[0].id] : []);
  elements.jsonInput.value = formatPayloadJson(result.payload);
  updateFromJson(elements, documentRef);
  renderSymbolWorkspace(elements, documentRef);
}

function createDefaultSymbolDefinition(payload: SchematicPayload): SchematicSymbolDefinition {
  const existingIds = new Set((payload.symbols ?? []).map((symbol) => symbol.id));
  let index = 1;
  let id = "symbol-1";

  while (existingIds.has(id)) {
    index += 1;
    id = `symbol-${index}`;
  }

  return {
    id,
    viewport: {
      width: 100,
      height: 80
    },
    parts: [
      { id: "body", label: "Body" }
    ],
    entitySlots: [
      { id: "state", label: "State", description: "Future slot binding target", valueType: "binary" }
    ],
    items: [
      {
        id: `${id}-body`,
        type: "rect",
        layer: 300,
        partId: "body",
        x: 10,
        y: 10,
        width: 80,
        height: 50,
        rx: 4,
        ry: 4,
        style: {
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 2
        }
      },
      {
        id: `${id}-label`,
        type: "text",
        layer: 600,
        x: 50,
        y: 42,
        text: "Symbol",
        style: {
          fill: "currentColor",
          fontSize: 12,
          textAnchor: "middle"
        }
      }
    ]
  };
}

function createEmptySymbolDefinition(payload: SchematicPayload): SchematicSymbolDefinition {
  const existingIds = new Set((payload.symbols ?? []).map((symbol) => symbol.id));
  let index = 1;
  let id = "imported-symbol-1";

  while (existingIds.has(id)) {
    index += 1;
    id = `imported-symbol-${index}`;
  }

  return {
    id,
    viewport: {
      width: 100,
      height: 80
    },
    parts: [],
    entitySlots: [],
    items: []
  };
}

function importSvgIntoSelectedSymbol(elements: EditorElements, documentRef: Document): void {
  const result = parseAndValidatePayload(elements.jsonInput.value);

  if (!result.ok) {
    renderSymbolWorkspaceError(elements, result.message);
    return;
  }

  const symbol = getActiveSymbol(result.payload, elements.activeSymbolId);

  if (!symbol) {
    elements.symbolWorkspaceStatus.textContent = "Create or select a symbol before importing SVG.";
    elements.symbolWorkspaceStatus.dataset.state = "error";
    return;
  }

  const importResult = parseSvgImportForSymbol(elements.symbolSvgImportInput.value, symbol, documentRef);

  if (!importResult.ok) {
    elements.symbolWorkspaceStatus.textContent = `SVG import error:\n${importResult.errors.map((error) => `- ${error}`).join("\n")}`;
    elements.symbolWorkspaceStatus.dataset.state = "error";
    return;
  }

  if (importResult.items.length === 0) {
    elements.symbolWorkspaceStatus.textContent = "SVG import skipped: no supported SVG primitives found";
    elements.symbolWorkspaceStatus.dataset.state = "error";
    return;
  }

  recordHistory(elements);
  const importedSymbolItems = importResult.items as SchematicSymbolDefinition["items"];
  symbol.items = [
    ...symbol.items,
    ...importedSymbolItems
  ];
  elements.symbolWorkspaceStarted = true;
  elements.symbolStartDialog.hidden = true;
  elements.activeSymbolId = symbol.id;
  setSelectedSymbolInternalItems(elements, [getSymbolInternalItemEntries(importedSymbolItems)[0]?.item.id].filter(Boolean) as string[]);
  elements.jsonInput.value = formatPayloadJson(result.payload);
  updateFromJson(elements, documentRef);
  renderSymbolWorkspace(elements, documentRef);
  elements.symbolWorkspaceStatus.textContent = importResult.warnings.length === 0
    ? `Imported ${importResult.items.length} SVG item(s) into ${symbol.id}`
    : `Imported ${importResult.items.length} SVG item(s) into ${symbol.id}\n${importResult.warnings.map((warning) => `- ${warning}`).join("\n")}`;
  elements.symbolWorkspaceStatus.dataset.state = "valid";
  closeSymbolImportDialog(elements);
}

function getActiveSymbol(payload: SchematicPayload, activeSymbolId: string | undefined): SchematicSymbolDefinition | undefined {
  const symbols = payload.symbols ?? [];
  return symbols.find((symbol) => symbol.id === activeSymbolId) ?? symbols[0];
}

function parseSvgImportForSymbol(
  markup: string,
  symbol: SchematicSymbolDefinition,
  documentRef: Document
): SvgImportResult {
  return parseSvgImport(markup, {
    schemaVersion: 1,
    viewport: symbol.viewport ?? { width: 100, height: 80 },
    items: symbol.items as SchematicItem[]
  }, documentRef);
}

function renderSymbolWorkspace(elements: EditorElements, documentRef: Document): void {
  elements.symbolStartDialog.hidden = elements.symbolWorkspaceStarted;
  const result = parseAndValidatePayload(elements.jsonInput.value);

  if (!result.ok) {
    renderSymbolWorkspaceError(elements, result.message);
    return;
  }

  const symbols = result.payload.symbols ?? [];
  renderSymbolOptions(elements, symbols, documentRef);

  if (symbols.length === 0) {
    renderEmptySymbolWorkspace(elements, "No symbols defined yet");
    return;
  }

  const selectedSymbol = getActiveSymbol(result.payload, elements.activeSymbolId);
  elements.activeSymbolId = selectedSymbol?.id;

  if (!selectedSymbol) {
    renderEmptySymbolWorkspace(elements, "No symbols defined yet");
    return;
  }

  elements.symbolSelect.value = selectedSymbol.id;
  renderSymbolPreview(elements, selectedSymbol, documentRef);
  renderSymbolInternalItems(elements, selectedSymbol, documentRef);
  renderSymbolPartsAndSlots(elements, selectedSymbol, documentRef);
  renderSymbolEditorInspector(elements, selectedSymbol, documentRef);
}

function renderSymbolOptions(elements: EditorElements, symbols: SchematicSymbolDefinition[], documentRef: Document): void {
  elements.symbolSelect.replaceChildren();

  if (symbols.length === 0) {
    const option = documentRef.createElement("option");
    option.value = "";
    option.textContent = "No symbols";
    elements.symbolSelect.append(option);
    return;
  }

  for (const symbol of symbols) {
    const option = documentRef.createElement("option");
    option.value = symbol.id;
    option.textContent = symbol.id;
    elements.symbolSelect.append(option);
  }
}

function renderSymbolPreview(elements: EditorElements, symbol: SchematicSymbolDefinition, documentRef: Document): void {
  const bounds = getBoundsFromItems(symbol.items);
  const viewport = symbol.viewport ?? (bounds ? {
    width: bounds.x + bounds.width,
    height: bounds.y + bounds.height
  } : { width: 100, height: 80 });
  const previewPayload: SchematicPayload = {
    schemaVersion: 1,
    viewport: {
      width: Math.max(1, viewport.width),
      height: Math.max(1, viewport.height)
    },
    symbols: [symbol],
    items: [
      {
        id: `symbol-preview-${symbol.id}`,
        type: "symbol",
        layer: 300,
        symbolId: symbol.id,
        x: 0,
        y: 0,
        slotBindings: getSymbolSimulationSlotBindings(symbol)
      }
    ]
  };
  const svg = renderSchematicSvg(previewPayload, {
    document: documentRef,
    entityStates: {
      ...demoEntityStates,
      ...getSymbolSimulationEntityStates(elements, symbol)
    }
  });
  applySymbolPreviewViewBox(elements, svg, previewPayload);
  renderSelectionRectangle(svg, elements.symbolSelectionRectState, documentRef);
  svg.addEventListener("click", (event) => {
    if (elements.symbolPanMode) {
      return;
    }

    if (elements.symbolSelectionRectSuppressNextClick) {
      delete elements.symbolSelectionRectSuppressNextClick;
      return;
    }

    const itemId = findSymbolPreviewInternalItemId(elements, symbol, event.target);

    if (!itemId) {
      clearSymbolSelection(elements, documentRef);
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      toggleSelectedSymbolInternalItem(elements, itemId);
    } else {
      setSelectedSymbolInternalItems(elements, [itemId], itemId);
    }
    renderSymbolWorkspace(elements, documentRef);
  });
  svg.addEventListener("wheel", (event) => handleSymbolPreviewWheel(elements, event));
  svg.addEventListener("mousedown", (event) => handleSymbolPreviewMouseDown(elements, symbol, event, documentRef));
  elements.symbolPreviewSurface.replaceChildren(svg);
  updateSymbolPreviewModeControls(elements);
  highlightSelectedSymbolInternalItem(elements);
}

function applySymbolPreviewViewBox(elements: EditorElements, svg: SVGSVGElement, payload: SchematicPayload): void {
  const fallback = {
    x: 0,
    y: 0,
    width: payload.viewport.width,
    height: payload.viewport.height
  };
  setSvgViewBox(svg, elements.symbolPreviewViewBox ?? fallback);
}

function getSymbolPreviewSvg(elements: EditorElements): SVGSVGElement | undefined {
  const svg = elements.symbolPreviewSurface.querySelector("svg");
  return svg && isSvgElement(svg, elements.editorRoot.ownerDocument) ? svg : undefined;
}

function getCurrentSymbolPreviewViewBox(elements: EditorElements, svg: SVGSVGElement): PreviewViewBox {
  return elements.symbolPreviewViewBox ?? getSvgIntrinsicViewBox(svg) ?? {
    x: 0,
    y: 0,
    width: 1,
    height: 1
  };
}

function zoomSymbolPreview(elements: EditorElements, scale: number, anchor?: SchematicPoint): void {
  const svg = getSymbolPreviewSvg(elements);

  if (!svg) {
    return;
  }

  const current = getCurrentSymbolPreviewViewBox(elements, svg);
  const nextWidth = current.width * scale;
  const nextHeight = current.height * scale;
  const centerX = anchor?.x ?? current.x + current.width / 2;
  const centerY = anchor?.y ?? current.y + current.height / 2;
  const anchorRatioX = (centerX - current.x) / current.width;
  const anchorRatioY = (centerY - current.y) / current.height;

  elements.symbolPreviewViewBox = {
    x: centerX - nextWidth * anchorRatioX,
    y: centerY - nextHeight * anchorRatioY,
    width: nextWidth,
    height: nextHeight
  };
  setSvgViewBox(svg, elements.symbolPreviewViewBox);
}

function handleSymbolPreviewWheel(elements: EditorElements, event: WheelEvent): void {
  const svg = event.currentTarget;

  if (!isSvgElement(svg, elements.editorRoot.ownerDocument)) {
    return;
  }

  event.preventDefault();
  zoomSymbolPreview(elements, event.deltaY < 0 ? 0.9 : 1.1, getSvgPoint(getSvgCoordinateSpace(svg), event));
}

function resetSymbolPreviewView(elements: EditorElements): void {
  const svg = getSymbolPreviewSvg(elements);
  delete elements.symbolPreviewViewBox;

  if (!svg) {
    return;
  }

  const fallback = getSvgDefaultViewBox(svg);

  if (fallback) {
    setSvgViewBox(svg, fallback);
  }
}

function toggleSymbolPanMode(elements: EditorElements, enabled: boolean): void {
  elements.symbolPanMode = enabled;
  updateSymbolPreviewModeControls(elements);
}

function updateSymbolPreviewModeControls(elements: EditorElements): void {
  elements.symbolSelectToolButton.setAttribute("aria-pressed", String(!elements.symbolPanMode));
  elements.symbolPanToolButton.setAttribute("aria-pressed", String(elements.symbolPanMode));
  elements.symbolPanToolButton.textContent = "✥";
  elements.symbolPreviewSurface.dataset.panMode = String(elements.symbolPanMode);
  elements.symbolDeleteItemButton.disabled = elements.selectedSymbolInternalItemIds.length === 0;
  elements.symbolClearSelectionButton.disabled = elements.selectedSymbolInternalItemIds.length === 0;
}

function handleSymbolPreviewMouseDown(
  elements: EditorElements,
  symbol: SchematicSymbolDefinition,
  event: MouseEvent,
  documentRef: Document
): void {
  const svg = event.currentTarget;

  if (!isSvgElement(svg, documentRef) || event.button !== 0) {
    return;
  }

  const coordinateSpace = getSvgCoordinateSpace(svg);
  const startPoint = getSvgPoint(coordinateSpace, event);

  if (elements.symbolPanMode) {
    elements.symbolPanState = {
      svg,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startViewBox: getCurrentSymbolPreviewViewBox(elements, svg),
      moved: false
    };
    elements.symbolPreviewSurface.dataset.panning = "true";
    event.preventDefault();

    const onMove = (moveEvent: MouseEvent): void => {
      panSymbolPreview(elements, moveEvent);
    };
    const stopPan = (): void => {
      documentRef.removeEventListener("mousemove", onMove);
      documentRef.removeEventListener("mouseup", stopPan);
      delete elements.symbolPanState;
      delete elements.symbolPreviewSurface.dataset.panning;
    };

    documentRef.addEventListener("mousemove", onMove);
    documentRef.addEventListener("mouseup", stopPan);
    return;
  }

  const itemId = findSymbolPreviewInternalItemId(elements, symbol, event.target);
  const item = findSymbolInternalItem(symbol, itemId);

  if (!item) {
    startSymbolSelectionRectangle(elements, symbol, svg, coordinateSpace, startPoint, event, documentRef);
    return;
  }

  if (event.ctrlKey || event.metaKey) {
    toggleSelectedSymbolInternalItem(elements, item.id);
    renderSymbolWorkspace(elements, documentRef);
    event.preventDefault();
    return;
  }

  const selectedIds = elements.selectedSymbolInternalItemIds.includes(item.id)
    ? elements.selectedSymbolInternalItemIds
    : [item.id];
  setSelectedSymbolInternalItems(elements, selectedIds, item.id);
  elements.symbolDragState = {
    itemId: item.id,
    startPoint,
    startItems: getSymbolInternalItemEntries(symbol.items)
      .filter((entry) => selectedIds.includes(entry.item.id))
      .map((entry) => ({
        itemId: entry.item.id,
        item: cloneItem(entry.item)
      })),
    coordinateSpace,
    historyRecorded: false
  };
  elements.symbolPreviewSurface.dataset.dragging = "true";
  renderSymbolWorkspace(elements, documentRef);
  event.preventDefault();

  const onMove = (moveEvent: MouseEvent): void => {
    dragSymbolInternalItem(elements, moveEvent, documentRef);
  };
  const stopDrag = (): void => {
    documentRef.removeEventListener("mousemove", onMove);
    documentRef.removeEventListener("mouseup", stopDrag);
    delete elements.symbolDragState;
    delete elements.symbolPreviewSurface.dataset.dragging;
  };

  documentRef.addEventListener("mousemove", onMove);
  documentRef.addEventListener("mouseup", stopDrag);
}

function panSymbolPreview(elements: EditorElements, event: MouseEvent): void {
  const state = elements.symbolPanState;
  const svg = getSymbolPreviewSvg(elements);

  if (!state || !svg) {
    return;
  }

  const bounds = svg.getBoundingClientRect();
  const dx = ((event.clientX - state.startClientX) / bounds.width) * state.startViewBox.width;
  const dy = ((event.clientY - state.startClientY) / bounds.height) * state.startViewBox.height;

  elements.symbolPreviewViewBox = {
    ...state.startViewBox,
    x: state.startViewBox.x - dx,
    y: state.startViewBox.y - dy
  };
  setSvgViewBox(svg, elements.symbolPreviewViewBox);
}

function startSymbolSelectionRectangle(
  elements: EditorElements,
  symbol: SchematicSymbolDefinition,
  svg: SVGSVGElement,
  coordinateSpace: SvgCoordinateSpace,
  startPoint: SchematicPoint,
  event: MouseEvent,
  documentRef: Document
): void {
  elements.symbolSelectionRectState = {
    svg,
    startPoint,
    currentPoint: startPoint,
    moved: false
  };
  event.preventDefault();

  const onMove = (moveEvent: MouseEvent): void => {
    const state = elements.symbolSelectionRectState;

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
  const stopSelection = (): void => {
    documentRef.removeEventListener("mousemove", onMove);
    documentRef.removeEventListener("mouseup", stopSelection);

    const state = elements.symbolSelectionRectState;
    delete elements.symbolSelectionRectState;

    if (!state?.moved) {
      return;
    }

    const selectedIds = findSymbolItemsInSelectionRect(symbol, getNormalizedRect(state.startPoint, state.currentPoint));
    setSelectedSymbolInternalItems(elements, selectedIds);
    elements.symbolSelectionRectSuppressNextClick = true;
    renderSymbolWorkspace(elements, documentRef);
  };

  documentRef.addEventListener("mousemove", onMove);
  documentRef.addEventListener("mouseup", stopSelection);
}

function findSymbolItemsInSelectionRect(symbol: SchematicSymbolDefinition, selectionRect: PreviewViewBox): string[] {
  return getSymbolInternalItemEntries(symbol.items)
    .filter((entry) => {
      const bounds = getItemBounds(entry.item);
      return bounds ? rectsIntersect(selectionRect, bounds) : false;
    })
    .map((entry) => entry.item.id);
}

function dragSymbolInternalItem(elements: EditorElements, event: MouseEvent, documentRef: Document): void {
  const state = elements.symbolDragState;

  if (!state) {
    return;
  }

  const currentPoint = getSvgPoint(state.coordinateSpace, event);
  const dx = currentPoint.x - state.startPoint.x;
  const dy = currentPoint.y - state.startPoint.y;
  const edit = getActiveSymbolEdit(elements);

  if (!edit.ok) {
    renderSymbolWorkspaceError(elements, edit.message);
    return;
  }

  const startItems = state.startItems
    .map((startItem) => ({
      startItem,
      item: findSymbolInternalItem(edit.symbol, startItem.itemId)
    }))
    .filter((entry): entry is { startItem: { itemId: string; item: SchematicItem }; item: SchematicItem } => entry.item !== undefined);

  if (startItems.length === 0) {
    showSymbolWorkspaceError(elements, "Selected symbol items were not found");
    return;
  }

  if (!state.historyRecorded) {
    recordHistory(elements);
    state.historyRecorded = true;
  }

  for (const { startItem, item } of startItems) {
    moveSymbolItemFromStart(item, startItem.item, dx, dy);
  }

  elements.jsonInput.value = formatPayloadJson(edit.payload);
  updateFromJson(elements, documentRef, { renderTools: false });
  renderSymbolWorkspace(elements, documentRef);
  showSymbolWorkspaceStatus(elements, startItems.length === 1 ? `Moved ${startItems[0].item.id}` : `Moved ${startItems.length} symbol items`);
}

function getSymbolSimulationSlotBindings(symbol: SchematicSymbolDefinition): Record<string, string> | undefined {
  const slots = symbol.entitySlots ?? [];

  if (slots.length === 0) {
    return undefined;
  }

  return Object.fromEntries(slots.map((slot) => [slot.id, getSymbolSimulationEntityId(slot.id)]));
}

function getSymbolSimulationEntityStates(
  elements: EditorElements,
  symbol: SchematicSymbolDefinition
): Record<string, string> {
  return Object.fromEntries((symbol.entitySlots ?? []).map((slot) => [
    getSymbolSimulationEntityId(slot.id),
    elements.symbolSimulationStates[slot.id] ?? "off"
  ]));
}

function getSymbolSimulationEntityId(slotId: string): string {
  return `__hsc_symbol_sim_${slotId}`;
}

function findSymbolPreviewInternalItemId(
  elements: EditorElements,
  symbol: SchematicSymbolDefinition,
  target: EventTarget | null
): string | undefined {
  const itemIds = new Set(getSymbolInternalItemEntries(symbol.items).map((entry) => entry.item.id));
  let current = target instanceof Element ? target : undefined;

  while (current && current !== elements.symbolPreviewSurface) {
    const itemId = current.getAttribute("data-id");

    if (itemId && itemIds.has(itemId)) {
      return itemId;
    }

    current = current.parentElement ?? undefined;
  }

  return undefined;
}

function renderSymbolInternalItems(
  elements: EditorElements,
  symbol: SchematicSymbolDefinition,
  documentRef: Document
): void {
  elements.symbolItemList.replaceChildren();
  const entries = getSymbolInternalItemEntries(symbol.items);

  if (entries.length === 0) {
    elements.symbolItemList.append(createSymbolWorkspaceEmpty(documentRef, "No internal items"));
    return;
  }

  const partIds = (symbol.parts ?? []).map((part) => part.id);
  const groupedEntries = new Map<string, SymbolInternalItemEntry[]>();

  for (const entry of entries) {
    const partId = entry.item.partId && partIds.includes(entry.item.partId) ? entry.item.partId : "unassigned";
    groupedEntries.set(partId, [...(groupedEntries.get(partId) ?? []), entry]);
  }

  for (const partId of [...partIds, "unassigned"]) {
    const group = groupedEntries.get(partId);

    if (!group || group.length === 0) {
      continue;
    }

    const heading = documentRef.createElement("div");
    heading.className = "symbol-item-group-heading";
    heading.textContent = partId === "unassigned"
      ? "Unassigned"
      : symbol.parts?.find((part) => part.id === partId)?.label
        ? `${partId} - ${symbol.parts.find((part) => part.id === partId)?.label}`
        : partId;
    elements.symbolItemList.append(heading);

    for (const entry of group) {
      elements.symbolItemList.append(createSymbolInternalItemButton(elements, entry, documentRef));
    }
  }
}

function createSymbolInternalItemButton(
  elements: EditorElements,
  entry: SymbolInternalItemEntry,
  documentRef: Document
): HTMLButtonElement {
  const { item, depth } = entry;
  const button = documentRef.createElement("button");
  button.className = "symbol-internal-item-button";
  button.type = "button";
  button.dataset.symbolItemId = item.id;
  button.setAttribute("aria-pressed", String(elements.selectedSymbolInternalItemIds.includes(item.id)));
  button.style.paddingLeft = `${10 + depth * 16}px`;
  button.textContent = `${item.id} (${item.type}${item.partId ? `, ${item.partId}` : ""})`;
  button.addEventListener("click", (event) => {
    if (event.ctrlKey || event.metaKey) {
      toggleSelectedSymbolInternalItem(elements, item.id);
    } else {
      setSelectedSymbolInternalItems(elements, [item.id], item.id);
    }

    renderSymbolWorkspace(elements, documentRef);
  });
  return button;
}

function renderSymbolPartsAndSlots(
  elements: EditorElements,
  symbol: SchematicSymbolDefinition,
  documentRef: Document
): void {
  elements.symbolPartsList.replaceChildren();
  elements.symbolSlotsList.replaceChildren();
  const selectedItem = findSymbolInternalItem(symbol, elements.selectedSymbolInternalItemId);

  if (!symbol.parts || symbol.parts.length === 0) {
    elements.symbolPartsList.append(createSymbolWorkspaceEmpty(documentRef, "No parts"));
  } else {
    for (const part of symbol.parts) {
      elements.symbolPartsList.append(createSymbolPartRow(elements, symbol, part, selectedItem, documentRef));
    }
  }
  elements.symbolPartsList.append(createSymbolPartAddControls(elements, documentRef));

  if (!symbol.entitySlots || symbol.entitySlots.length === 0) {
    elements.symbolSlotsList.append(createSymbolWorkspaceEmpty(documentRef, "No entity slots"));
  } else {
    for (const slot of symbol.entitySlots) {
      elements.symbolSlotsList.append(createSymbolSlotRow(elements, symbol, slot, documentRef));
    }
  }
  elements.symbolSlotsList.append(createSymbolSlotAddControls(elements, documentRef));
}

function createSymbolPartRow(
  elements: EditorElements,
  symbol: SchematicSymbolDefinition,
  part: NonNullable<SchematicSymbolDefinition["parts"]>[number],
  selectedItem: SchematicItem | undefined,
  documentRef: Document
): HTMLElement {
  const row = documentRef.createElement("div");
  row.className = "symbol-manager-row symbol-part-row";
  row.dataset.partId = part.id;

  const title = documentRef.createElement("div");
  title.className = "symbol-manager-title";
  title.textContent = part.label ? `${part.id} - ${part.label}` : part.id;

  const idInput = documentRef.createElement("input");
  idInput.className = "inspector-input symbol-part-id-input";
  idInput.type = "text";
  idInput.value = part.id;
  idInput.setAttribute("aria-label", `Part id ${part.id}`);
  idInput.addEventListener("change", () => updateSymbolPart(elements, part.id, "id", idInput.value, documentRef));

  const labelInput = documentRef.createElement("input");
  labelInput.className = "inspector-input symbol-part-label-input";
  labelInput.type = "text";
  labelInput.value = part.label ?? "";
  labelInput.placeholder = "Label";
  labelInput.setAttribute("aria-label", `Part label ${part.id}`);
  labelInput.addEventListener("change", () => updateSymbolPart(elements, part.id, "label", labelInput.value, documentRef));

  const itemSummary = documentRef.createElement("div");
  itemSummary.className = "field-helper symbol-manager-summary";
  const itemIds = getSymbolPartItemIds(symbol, part.id);
  itemSummary.textContent = itemIds.length > 0 ? `Items: ${itemIds.join(", ")}` : "No assigned items";

  const assignButton = documentRef.createElement("button");
  assignButton.className = "secondary-button symbol-assign-selected-part-button";
  assignButton.type = "button";
  assignButton.textContent = "Assign selected";
  assignButton.disabled = !selectedItem;
  assignButton.addEventListener("click", () => {
    updateSelectedSymbolInternalItemPart(elements, part.id, documentRef);
  });

  const deleteButton = documentRef.createElement("button");
  deleteButton.className = "secondary-button symbol-delete-part-button";
  deleteButton.type = "button";
  deleteButton.textContent = "Delete part";
  deleteButton.addEventListener("click", () => deleteSymbolPart(elements, part.id, documentRef));

  row.append(title, idInput, labelInput, itemSummary, assignButton, deleteButton);
  return row;
}

function createSymbolPartAddControls(elements: EditorElements, documentRef: Document): HTMLElement {
  const row = documentRef.createElement("div");
  row.className = "symbol-manager-add-row";

  const input = documentRef.createElement("input");
  input.className = "inspector-input symbol-add-part-input";
  input.type = "text";
  input.placeholder = "new-part-id";

  const button = documentRef.createElement("button");
  button.className = "secondary-button symbol-add-part-button";
  button.type = "button";
  button.textContent = "Add part";
  button.addEventListener("click", () => addSymbolPart(elements, input.value, documentRef));

  row.append(input, button);
  return row;
}

function createSymbolSlotRow(
  elements: EditorElements,
  symbol: SchematicSymbolDefinition,
  slot: NonNullable<SchematicSymbolDefinition["entitySlots"]>[number],
  documentRef: Document
): HTMLElement {
  const row = documentRef.createElement("div");
  row.className = "symbol-manager-row symbol-slot-row";
  row.dataset.slotId = slot.id;

  const title = documentRef.createElement("div");
  title.className = "symbol-manager-title";
  title.textContent = slot.label ? `${slot.id} - ${slot.label}` : slot.id;

  const idInput = documentRef.createElement("input");
  idInput.className = "inspector-input symbol-slot-id-input";
  idInput.type = "text";
  idInput.value = slot.id;
  idInput.setAttribute("aria-label", `Slot id ${slot.id}`);
  idInput.addEventListener("change", () => updateSymbolSlot(elements, slot.id, "id", idInput.value, documentRef));

  const labelInput = documentRef.createElement("input");
  labelInput.className = "inspector-input symbol-slot-label-input";
  labelInput.type = "text";
  labelInput.value = slot.label ?? "";
  labelInput.placeholder = "Label";
  labelInput.setAttribute("aria-label", `Slot label ${slot.id}`);
  labelInput.addEventListener("change", () => updateSymbolSlot(elements, slot.id, "label", labelInput.value, documentRef));

  const descriptionInput = documentRef.createElement("input");
  descriptionInput.className = "inspector-input symbol-slot-description-input";
  descriptionInput.type = "text";
  descriptionInput.value = slot.description ?? "";
  descriptionInput.placeholder = "Description";
  descriptionInput.setAttribute("aria-label", `Slot description ${slot.id}`);
  descriptionInput.addEventListener("change", () => updateSymbolSlot(elements, slot.id, "description", descriptionInput.value, documentRef));

  const requiredLabel = documentRef.createElement("label");
  requiredLabel.className = "symbol-manager-checkbox";
  const requiredInput = documentRef.createElement("input");
  requiredInput.className = "symbol-slot-required-input";
  requiredInput.type = "checkbox";
  requiredInput.checked = slot.required === true;
  requiredInput.addEventListener("change", () => updateSymbolSlot(elements, slot.id, "required", String(requiredInput.checked), documentRef));
  const requiredText = documentRef.createElement("span");
  requiredText.textContent = "Required";
  requiredLabel.append(requiredInput, requiredText);

  const typeSelect = documentRef.createElement("select");
  typeSelect.className = "inspector-input symbol-slot-type-select";
  typeSelect.setAttribute("aria-label", `Slot type ${slot.id}`);
  for (const option of [
    ["binary", "Binary ON/OFF"],
    ["percent", "Percent 0-100"],
    ["temperature", "Temperature/value"],
    ["text", "Text"]
  ] as Array<[SymbolSlotValueType, string]>) {
    const typeOption = documentRef.createElement("option");
    typeOption.value = option[0];
    typeOption.textContent = option[1];
    typeSelect.append(typeOption);
  }
  typeSelect.value = getSymbolSlotValueType(symbol, slot, getSymbolSlotEffects(symbol, slot.id));
  typeSelect.addEventListener("change", () => {
    updateSymbolSlot(elements, slot.id, "valueType", typeSelect.value, documentRef);
  });

  const effects = getSymbolSlotEffects(symbol, slot.id);
  const effectSummary = documentRef.createElement("div");
  effectSummary.className = "field-helper symbol-manager-summary";
  effectSummary.textContent = effects.length > 0 ? `Affects: ${effects.join("; ")}` : "No effect configured";

  const deleteButton = documentRef.createElement("button");
  deleteButton.className = "secondary-button symbol-delete-slot-button";
  deleteButton.type = "button";
  deleteButton.textContent = "Delete slot";
  deleteButton.addEventListener("click", () => deleteSymbolSlot(elements, slot.id, documentRef));

  row.append(
    title,
    idInput,
    labelInput,
    descriptionInput,
    typeSelect,
    requiredLabel,
    effectSummary,
    createSymbolSlotSimulationControls(elements, symbol, slot, effects, documentRef),
    deleteButton
  );
  return row;
}

function createSymbolSlotSimulationControls(
  elements: EditorElements,
  symbol: SchematicSymbolDefinition,
  slot: NonNullable<SchematicSymbolDefinition["entitySlots"]>[number],
  effects: string[],
  documentRef: Document
): HTMLElement {
  const wrapper = documentRef.createElement("div");
  wrapper.className = "symbol-simulation-field";

  const label = documentRef.createElement("span");
  label.className = "field-helper";
  label.textContent = "Simulate";
  wrapper.append(label);

  const currentValue = elements.symbolSimulationStates[slot.id] ?? getDefaultSymbolSlotSimulationValue(symbol, slot.id);
  const valueType = getSymbolSlotValueType(symbol, slot, effects);

  if (valueType === "binary") {
    const offButton = documentRef.createElement("button");
    offButton.className = "secondary-button symbol-slot-simulation-off-button";
    offButton.type = "button";
    offButton.textContent = "OFF";
    offButton.setAttribute("aria-pressed", String(currentValue !== "on"));
    offButton.addEventListener("click", () => updateSymbolSimulationState(elements, slot.id, "off", documentRef));

    const onButton = documentRef.createElement("button");
    onButton.className = "secondary-button symbol-slot-simulation-on-button";
    onButton.type = "button";
    onButton.textContent = "ON";
    onButton.setAttribute("aria-pressed", String(currentValue === "on"));
    onButton.addEventListener("click", () => updateSymbolSimulationState(elements, slot.id, "on", documentRef));

    wrapper.append(offButton, onButton);
    return wrapper;
  }

  if (valueType === "percent") {
    const slider = documentRef.createElement("input");
    slider.className = "style-slider-input symbol-slot-simulation-slider";
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.step = "1";
    slider.value = Number.isFinite(Number(currentValue)) ? currentValue : "0";

    const input = documentRef.createElement("input");
    input.className = "inspector-input symbol-slot-simulation-percent-input";
    input.type = "number";
    input.min = "0";
    input.max = "100";
    input.step = "1";
    input.value = slider.value;

    slider.addEventListener("input", () => {
      input.value = slider.value;
    });
    slider.addEventListener("change", () => {
      updateSymbolSimulationState(elements, slot.id, slider.value, documentRef);
    });
    input.addEventListener("change", () => {
      const value = clampNumber(Number(input.value), 0, 100);
      input.value = String(value);
      slider.value = String(value);
      updateSymbolSimulationState(elements, slot.id, String(value), documentRef);
    });

    wrapper.append(slider, input);
    return wrapper;
  }

  const input = documentRef.createElement("input");
  input.className = "inspector-input symbol-slot-simulation-input";
  input.type = valueType === "temperature" ? "number" : "text";
  input.value = currentValue;
  input.placeholder = valueType === "temperature" ? "20" : "state or value";
  input.addEventListener("change", () => updateSymbolSimulationState(elements, slot.id, input.value, documentRef));
  wrapper.append(input);
  return wrapper;
}

function updateSymbolSimulationState(elements: EditorElements, slotId: string, value: string, documentRef: Document): void {
  elements.symbolSimulationStates[slotId] = value;
  renderSymbolWorkspace(elements, documentRef);
}

function getDefaultSymbolSlotSimulationValue(symbol: SchematicSymbolDefinition, slotId: string): string {
  const slot = (symbol.entitySlots ?? []).find((candidate) => candidate.id === slotId);
  const valueType = slot ? getSymbolSlotValueType(symbol, slot, getSymbolSlotEffects(symbol, slotId)) : undefined;

  if (valueType === "binary") {
    return "off";
  }

  if (valueType === "text") {
    return "";
  }

  return "0";
}

function parseSymbolSlotValueType(value: string): SymbolSlotValueType | undefined {
  if (value === "binary" || value === "percent" || value === "temperature" || value === "text") {
    return value;
  }

  return undefined;
}

function getSymbolSlotValueType(
  symbol: SchematicSymbolDefinition,
  slot: NonNullable<SchematicSymbolDefinition["entitySlots"]>[number],
  effects: string[]
): SymbolSlotValueType {
  if (slot.valueType) {
    return slot.valueType;
  }

  if (isBinarySymbolSlot(symbol, slot.id)) {
    return "binary";
  }

  if (isNumericSymbolSlot(slot.id, effects)) {
    return "percent";
  }

  return /temp|temperature/i.test(slot.id) ? "temperature" : "text";
}

function isBinarySymbolSlot(symbol: SchematicSymbolDefinition, slotId: string): boolean {
  const values = getSymbolSlotConditionValues(symbol, slotId);
  return values.has("on") || values.has("off") || /(^|[-_])(alarm|running|enabled|active|state)($|[-_])/i.test(slotId);
}

function isNumericSymbolSlot(slotId: string, effects: string[]): boolean {
  return /(^|[-_])(percent|percentage|level|speed|position|value)($|[-_])/i.test(slotId)
    || effects.some((effect) => /\b0\b|\b100\b|percent/i.test(effect));
}

function getSymbolSlotConditionValues(symbol: SchematicSymbolDefinition, slotId: string): Set<string> {
  const values = new Set<string>();
  const entityId = `slot:${slotId}`;

  for (const style of symbol.partStyles ?? []) {
    if (style.when.entityId === entityId) {
      values.add(style.when.equals);
    }
  }

  for (const animation of symbol.partAnimations ?? []) {
    if (animation.when.entityId === entityId) {
      values.add(animation.when.equals);
    }
  }

  return values;
}

function getSymbolSlotEffects(symbol: SchematicSymbolDefinition, slotId: string): string[] {
  const entityId = `slot:${slotId}`;
  const effects: string[] = [];

  for (const style of symbol.partStyles ?? []) {
    if (style.when.entityId === entityId) {
      effects.push(`${style.partId} style when ${slotId} = ${style.when.equals}`);
    }
  }

  for (const animation of symbol.partAnimations ?? []) {
    if (animation.when.entityId === entityId) {
      effects.push(`${animation.partId} ${animation.preset} when ${slotId} = ${animation.when.equals}`);
    }
  }

  return effects;
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function createSymbolSlotAddControls(elements: EditorElements, documentRef: Document): HTMLElement {
  const row = documentRef.createElement("div");
  row.className = "symbol-manager-add-row";

  const input = documentRef.createElement("input");
  input.className = "inspector-input symbol-add-slot-input";
  input.type = "text";
  input.placeholder = "new-slot-id";

  const button = documentRef.createElement("button");
  button.className = "secondary-button symbol-add-slot-button";
  button.type = "button";
  button.textContent = "Add slot";
  button.addEventListener("click", () => addSymbolSlot(elements, input.value, documentRef));

  row.append(input, button);
  return row;
}

function renderSymbolEditorInspector(
  elements: EditorElements,
  symbol: SchematicSymbolDefinition,
  documentRef: Document
): void {
  elements.symbolInspector.replaceChildren();

  if (elements.selectedSymbolInternalItemIds.length > 1) {
    elements.symbolInspector.append(createSymbolWorkspaceEmpty(
      documentRef,
      `${elements.selectedSymbolInternalItemIds.length} internal items selected`
    ));
    return;
  }

  const selectedItem = findSymbolInternalItem(symbol, elements.selectedSymbolInternalItemId);

  if (!selectedItem) {
    elements.symbolInspector.append(createSymbolWorkspaceEmpty(documentRef, "Select an internal item"));
    return;
  }

  const summary = documentRef.createElement("div");
  summary.className = "symbol-workspace-row";
  summary.textContent = `Item: ${selectedItem.id} (${selectedItem.type})`;
  elements.symbolInspector.append(summary);

  const partSummary = documentRef.createElement("div");
  partSummary.className = "symbol-workspace-row";
  partSummary.textContent = `Part: ${selectedItem.partId ?? "none"}`;
  elements.symbolInspector.append(partSummary);

  appendSymbolInternalItemField(elements, documentRef, selectedItem, "id", "text");
  appendSymbolInternalItemField(elements, documentRef, selectedItem, "layer", "number");
  appendSymbolPartAssignmentField(elements, documentRef, symbol, selectedItem);
  appendSymbolInternalStyleInspector(elements, documentRef, selectedItem);
}

function addSymbolPart(elements: EditorElements, rawPartId: string, documentRef: Document): void {
  const edit = getActiveSymbolEdit(elements);

  if (!edit.ok) {
    renderSymbolWorkspaceError(elements, edit.message);
    return;
  }

  const partId = rawPartId.trim();

  if (!isValidSymbolMetadataId(partId)) {
    showSymbolWorkspaceError(elements, "Part id must start with a letter and use letters, numbers, _ or -");
    return;
  }

  if ((edit.symbol.parts ?? []).some((part) => part.id === partId)) {
    showSymbolWorkspaceError(elements, `Part "${partId}" already exists`);
    return;
  }

  recordHistory(elements);
  edit.symbol.parts = [
    ...(edit.symbol.parts ?? []),
    {
      id: partId,
      label: partId
    }
  ];
  commitSymbolEditorPayload(elements, edit.payload, documentRef);
  showSymbolWorkspaceStatus(elements, `Added part ${partId}`);
}

function updateSymbolPart(
  elements: EditorElements,
  partId: string,
  fieldName: "id" | "label",
  rawValue: string,
  documentRef: Document
): void {
  const edit = getActiveSymbolEdit(elements);

  if (!edit.ok) {
    renderSymbolWorkspaceError(elements, edit.message);
    return;
  }

  const part = (edit.symbol.parts ?? []).find((candidate) => candidate.id === partId);

  if (!part) {
    showSymbolWorkspaceError(elements, `Part "${partId}" was not found`);
    return;
  }

  const value = rawValue.trim();

  if (fieldName === "id") {
    if (!isValidSymbolMetadataId(value)) {
      showSymbolWorkspaceError(elements, "Part id must start with a letter and use letters, numbers, _ or -");
      return;
    }

    if (value !== partId && (edit.symbol.parts ?? []).some((candidate) => candidate.id === value)) {
      showSymbolWorkspaceError(elements, `Part "${value}" already exists`);
      return;
    }

    if (value === part.id) {
      return;
    }

    recordHistory(elements);
    renameSymbolPartReferences(edit.symbol, part.id, value);
    part.id = value;
    commitSymbolEditorPayload(elements, edit.payload, documentRef);
    showSymbolWorkspaceStatus(elements, `Renamed part ${partId} to ${value}`);
    return;
  }

  if ((part.label ?? "") === value) {
    return;
  }

  recordHistory(elements);

  if (value.length === 0) {
    delete part.label;
  } else {
    part.label = value;
  }

  commitSymbolEditorPayload(elements, edit.payload, documentRef);
  showSymbolWorkspaceStatus(elements, `Updated part ${part.id}`);
}

function addSymbolSlot(elements: EditorElements, rawSlotId: string, documentRef: Document): void {
  const edit = getActiveSymbolEdit(elements);

  if (!edit.ok) {
    renderSymbolWorkspaceError(elements, edit.message);
    return;
  }

  const slotId = rawSlotId.trim();

  if (!isValidSymbolMetadataId(slotId)) {
    showSymbolWorkspaceError(elements, "Slot id must start with a letter and use letters, numbers, _ or -");
    return;
  }

  if ((edit.symbol.entitySlots ?? []).some((slot) => slot.id === slotId)) {
    showSymbolWorkspaceError(elements, `Slot "${slotId}" already exists`);
    return;
  }

  recordHistory(elements);
  edit.symbol.entitySlots = [
    ...(edit.symbol.entitySlots ?? []),
    {
      id: slotId,
      label: slotId
    }
  ];
  elements.symbolSimulationStates[slotId] = elements.symbolSimulationStates[slotId] ?? "off";
  commitSymbolEditorPayload(elements, edit.payload, documentRef);
  showSymbolWorkspaceStatus(elements, `Added slot ${slotId}`);
}

function deleteSymbolPart(elements: EditorElements, partId: string, documentRef: Document): void {
  const edit = getActiveSymbolEdit(elements);

  if (!edit.ok) {
    renderSymbolWorkspaceError(elements, edit.message);
    return;
  }

  if (!confirmSymbolEditorAction(elements, `Delete part "${partId}"? Internal items will keep rendering but lose this part assignment.`)) {
    return;
  }

  const parts = edit.symbol.parts ?? [];

  if (!parts.some((part) => part.id === partId)) {
    showSymbolWorkspaceError(elements, `Part "${partId}" was not found`);
    return;
  }

  recordHistory(elements);
  edit.symbol.parts = parts.filter((part) => part.id !== partId);
  for (const entry of getSymbolInternalItemEntries(edit.symbol.items)) {
    if (entry.item.partId === partId) {
      delete entry.item.partId;
    }
  }
  edit.symbol.partStyles = edit.symbol.partStyles?.filter((style) => style.partId !== partId);
  edit.symbol.partAnimations = edit.symbol.partAnimations?.filter((animation) => animation.partId !== partId);
  commitSymbolEditorPayload(elements, edit.payload, documentRef);
  showSymbolWorkspaceStatus(elements, `Deleted part ${partId}`);
}

function deleteSymbolSlot(elements: EditorElements, slotId: string, documentRef: Document): void {
  const edit = getActiveSymbolEdit(elements);

  if (!edit.ok) {
    renderSymbolWorkspaceError(elements, edit.message);
    return;
  }

  if (!confirmSymbolEditorAction(elements, `Delete entity slot "${slotId}"? Related symbol effects and instance bindings will be removed.`)) {
    return;
  }

  const slots = edit.symbol.entitySlots ?? [];

  if (!slots.some((slot) => slot.id === slotId)) {
    showSymbolWorkspaceError(elements, `Slot "${slotId}" was not found`);
    return;
  }

  recordHistory(elements);
  const slotEntityId = `slot:${slotId}`;
  edit.symbol.entitySlots = slots.filter((slot) => slot.id !== slotId);
  edit.symbol.partStyles = edit.symbol.partStyles?.filter((style) => style.when.entityId !== slotEntityId);
  edit.symbol.partAnimations = edit.symbol.partAnimations?.filter((animation) => animation.when.entityId !== slotEntityId);

  for (const item of edit.payload.items) {
    if (item.type !== "symbol" || item.symbolId !== edit.symbol.id || !item.slotBindings) {
      continue;
    }

    delete item.slotBindings[slotId];

    if (Object.keys(item.slotBindings).length === 0) {
      delete item.slotBindings;
    }
  }

  delete elements.symbolSimulationStates[slotId];
  commitSymbolEditorPayload(elements, edit.payload, documentRef);
  showSymbolWorkspaceStatus(elements, `Deleted slot ${slotId}`);
}

function confirmSymbolEditorAction(elements: EditorElements, message: string): boolean {
  return elements.editorRoot.ownerDocument.defaultView?.confirm?.(message) ?? true;
}

function updateSymbolSlot(
  elements: EditorElements,
  slotId: string,
  fieldName: "id" | "label" | "description" | "required" | "valueType",
  rawValue: string,
  documentRef: Document
): void {
  const edit = getActiveSymbolEdit(elements);

  if (!edit.ok) {
    renderSymbolWorkspaceError(elements, edit.message);
    return;
  }

  const slot = (edit.symbol.entitySlots ?? []).find((candidate) => candidate.id === slotId);

  if (!slot) {
    showSymbolWorkspaceError(elements, `Slot "${slotId}" was not found`);
    return;
  }

  const value = rawValue.trim();

  if (fieldName === "id") {
    if (!isValidSymbolMetadataId(value)) {
      showSymbolWorkspaceError(elements, "Slot id must start with a letter and use letters, numbers, _ or -");
      return;
    }

    if (value !== slotId && (edit.symbol.entitySlots ?? []).some((candidate) => candidate.id === value)) {
      showSymbolWorkspaceError(elements, `Slot "${value}" already exists`);
      return;
    }

    if (value === slot.id) {
      return;
    }

    recordHistory(elements);
    renameSymbolSlotReferences(edit.payload, edit.symbol, slot.id, value);
    slot.id = value;
    elements.symbolSimulationStates[value] = elements.symbolSimulationStates[slotId] ?? "off";
    delete elements.symbolSimulationStates[slotId];
    commitSymbolEditorPayload(elements, edit.payload, documentRef);
    showSymbolWorkspaceStatus(elements, `Renamed slot ${slotId} to ${value}`);
    return;
  }

  if (fieldName === "required") {
    const nextRequired = value === "true";

    if ((slot.required ?? false) === nextRequired) {
      return;
    }

    recordHistory(elements);

    if (nextRequired) {
      slot.required = true;
    } else {
      delete slot.required;
    }

    commitSymbolEditorPayload(elements, edit.payload, documentRef);
    showSymbolWorkspaceStatus(elements, `Updated slot ${slot.id}`);
    return;
  }

  if (fieldName === "valueType") {
    const nextValue = parseSymbolSlotValueType(rawValue);

    if (!nextValue) {
      showSymbolWorkspaceError(elements, "Slot type must be binary, percent, temperature, or text");
      return;
    }

    if (slot.valueType === nextValue) {
      return;
    }

    recordHistory(elements);
    slot.valueType = nextValue;
    elements.symbolSimulationStates[slot.id] = getDefaultSymbolSlotSimulationValue(edit.symbol, slot.id);
    commitSymbolEditorPayload(elements, edit.payload, documentRef);
    showSymbolWorkspaceStatus(elements, `Updated slot type for ${slot.id}`);
    return;
  }

  if ((slot[fieldName] ?? "") === value) {
    return;
  }

  recordHistory(elements);

  if (value.length === 0) {
    delete slot[fieldName];
  } else {
    slot[fieldName] = value;
  }

  commitSymbolEditorPayload(elements, edit.payload, documentRef);
  showSymbolWorkspaceStatus(elements, `Updated slot ${slot.id}`);
}

function renameSymbolPartReferences(symbol: SchematicSymbolDefinition, oldPartId: string, newPartId: string): void {
  for (const entry of getSymbolInternalItemEntries(symbol.items)) {
    if (entry.item.partId === oldPartId) {
      entry.item.partId = newPartId;
    }
  }

  for (const style of symbol.partStyles ?? []) {
    if (style.partId === oldPartId) {
      style.partId = newPartId;
    }
  }

  for (const animation of symbol.partAnimations ?? []) {
    if (animation.partId === oldPartId) {
      animation.partId = newPartId;
    }
  }
}

function renameSymbolSlotReferences(
  payload: SchematicPayload,
  symbol: SchematicSymbolDefinition,
  oldSlotId: string,
  newSlotId: string
): void {
  const oldEntityId = `slot:${oldSlotId}`;
  const newEntityId = `slot:${newSlotId}`;

  for (const style of symbol.partStyles ?? []) {
    if (style.when.entityId === oldEntityId) {
      style.when.entityId = newEntityId;
    }
  }

  for (const animation of symbol.partAnimations ?? []) {
    if (animation.when.entityId === oldEntityId) {
      animation.when.entityId = newEntityId;
    }
  }

  for (const item of payload.items) {
    if (item.type !== "symbol" || item.symbolId !== symbol.id || !item.slotBindings?.[oldSlotId]) {
      continue;
    }

    item.slotBindings = {
      ...item.slotBindings,
      [newSlotId]: item.slotBindings[oldSlotId]
    };
    delete item.slotBindings[oldSlotId];
  }
}

function isValidSymbolMetadataId(value: string): boolean {
  return /^[A-Za-z][A-Za-z0-9_-]*$/.test(value);
}

function appendSymbolInternalItemField(
  elements: EditorElements,
  documentRef: Document,
  item: SchematicItem,
  fieldName: "id" | "layer",
  valueType: "number" | "text"
): void {
  const label = documentRef.createElement("label");
  label.className = "inspector-field symbol-inspector-field";
  label.dataset.fieldName = fieldName;

  const labelText = documentRef.createElement("span");
  labelText.className = "field-label";
  labelText.textContent = fieldName === "id" ? "Internal item id" : "Layer / z-order";

  const input = documentRef.createElement("input");
  input.className = "inspector-input symbol-internal-item-input";
  input.type = "text";
  input.value = String((item as Record<string, unknown>)[fieldName]);

  if (valueType === "number") {
    input.inputMode = "decimal";
  }

  input.addEventListener("change", () => {
    updateSelectedSymbolInternalItemField(elements, fieldName, input.value, valueType, documentRef);
  });

  const helper = documentRef.createElement("span");
  helper.className = "field-helper";
  helper.textContent = fieldName === "id"
    ? "Unique inside this symbol. Used for selection, parts, and JSON lookup."
    : "Higher layers render in front inside the symbol.";

  label.append(labelText, input, helper);
  elements.symbolInspector.append(label);
}

function appendSymbolPartAssignmentField(
  elements: EditorElements,
  documentRef: Document,
  symbol: SchematicSymbolDefinition,
  item: SchematicItem
): void {
  const partIds = symbol.parts?.map((part) => part.id) ?? [];
  const field = documentRef.createElement("div");
  field.className = "inspector-field symbol-inspector-field";
  field.dataset.fieldName = "partId";

  const labelText = documentRef.createElement("span");
  labelText.className = "field-label";
  labelText.textContent = "Symbol part";

  const select = documentRef.createElement("select");
  select.className = "inspector-input symbol-part-select";

  const noneOption = documentRef.createElement("option");
  noneOption.value = "";
  noneOption.textContent = "No part";
  select.append(noneOption);

  for (const part of symbol.parts ?? []) {
    const option = documentRef.createElement("option");
    option.value = part.id;
    option.textContent = part.label ? `${part.id} - ${part.label}` : part.id;
    select.append(option);
  }

  select.value = item.partId ?? "";
  select.addEventListener("change", () => {
    updateSelectedSymbolInternalItemPart(elements, select.value, documentRef);
  });

  const createControls = documentRef.createElement("div");
  createControls.className = "symbol-part-create-controls";

  const newPartInput = documentRef.createElement("input");
  newPartInput.className = "inspector-input symbol-new-part-input";
  newPartInput.type = "text";
  newPartInput.placeholder = partIds.length === 0 ? "body" : "new-part-id";

  const createButton = documentRef.createElement("button");
  createButton.className = "secondary-button symbol-create-part-button";
  createButton.type = "button";
  createButton.textContent = "Create part";
  createButton.addEventListener("click", () => {
    createSymbolPartForSelectedItem(elements, newPartInput.value, documentRef);
  });

  const helper = documentRef.createElement("span");
  helper.className = "field-helper";
  helper.textContent = "Assign this internal item to a symbol part, or create a simple new part from its id.";

  createControls.append(newPartInput, createButton);
  field.append(labelText, select, createControls, helper);
  elements.symbolInspector.append(field);
}

function appendSymbolInternalStyleInspector(elements: EditorElements, documentRef: Document, item: SchematicItem): void {
  const fields = getStyleFieldConfigs(item);

  if (fields.length === 0) {
    return;
  }

  const section = documentRef.createElement("section");
  section.className = "style-inspector-section symbol-style-inspector-section";

  const heading = documentRef.createElement("div");
  heading.className = "field-label";
  heading.textContent = "Style";

  section.append(heading);

  for (const field of fields) {
    appendSymbolInternalStyleField(elements, documentRef, section, item, field);
  }

  elements.symbolInspector.append(section);
}

function appendSymbolInternalStyleField(
  elements: EditorElements,
  documentRef: Document,
  section: HTMLElement,
  item: SchematicItem,
  field: StyleFieldConfig
): void {
  const fieldElement = documentRef.createElement("div");
  fieldElement.className = "inspector-field style-inspector-field symbol-style-field";
  fieldElement.dataset.fieldName = field.name;

  const labelText = documentRef.createElement("span");
  labelText.className = "field-label";
  labelText.textContent = STYLE_FIELD_LABELS[field.name];

  const input = documentRef.createElement("input");
  input.className = "inspector-input style-inspector-input symbol-style-input";
  input.type = "text";
  input.dataset.styleField = field.name;
  input.value = formatStyleFieldValue(item.style?.[field.name], field.name);

  if (field.valueType === "number") {
    input.inputMode = "decimal";
  }

  input.addEventListener("change", () => {
    updateSelectedSymbolInternalItemStyleField(elements, field, input.value, documentRef);
  });

  fieldElement.append(labelText);

  if (field.name === "stroke" || field.name === "fill") {
    fieldElement.append(createSymbolPaintFieldControls(elements, documentRef, field, input));
  } else if (field.valueType === "number") {
    fieldElement.append(createSymbolNumberFieldControls(elements, documentRef, field, input));
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

function createSymbolNumberFieldControls(
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
  slider.className = "style-slider-input symbol-style-slider-input";
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
  });
  slider.addEventListener("change", () => {
    updateSelectedSymbolInternalItemStyleField(elements, field, input.value, documentRef);
  });

  controls.append(input, slider);
  return controls;
}

function createSymbolPaintFieldControls(
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
  colorInput.className = "style-color-input symbol-style-color-input";
  colorInput.type = "color";
  colorInput.value = isHexColor(input.value) ? normalizeHexColor(input.value) : "#000000";
  colorInput.title = "Pick color";
  colorInput.addEventListener("input", () => {
    input.value = colorInput.value;
    updateSelectedSymbolInternalItemStyleField(elements, field, input.value, documentRef);
  });

  const presetSelect = documentRef.createElement("select");
  presetSelect.className = "style-preset-select symbol-style-preset-select";
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
    updateSelectedSymbolInternalItemStyleField(elements, field, input.value, documentRef);
  });

  controls.append(input, colorInput);
  group.append(controls, presetSelect);
  return group;
}

function updateSelectedSymbolInternalItemField(
  elements: EditorElements,
  fieldName: "id" | "layer",
  rawValue: string,
  valueType: "number" | "text",
  documentRef: Document
): void {
  const edit = getSelectedSymbolInternalItemEdit(elements);

  if (!edit.ok) {
    renderSymbolWorkspaceError(elements, edit.message);
    return;
  }

  const nextValue = valueType === "number" ? Number(rawValue) : rawValue.trim();

  if (valueType === "number" && !Number.isFinite(nextValue)) {
    showSymbolWorkspaceError(elements, `${fieldName} must be a finite number`);
    return;
  }

  if (fieldName === "id") {
    const itemId = String(nextValue);

    if (itemId.length === 0) {
      showSymbolWorkspaceError(elements, "Internal item id must be a non-empty string");
      return;
    }

    const existingIds = getSymbolInternalItemEntries(edit.symbol.items)
      .filter((entry) => entry.item !== edit.item)
      .map((entry) => entry.item.id);

    if (existingIds.includes(itemId)) {
      showSymbolWorkspaceError(elements, `Internal item id "${itemId}" is already used`);
      return;
    }
  }

  if ((edit.item as Record<string, unknown>)[fieldName] === nextValue) {
    return;
  }

  recordHistory(elements);
  const previousItemId = edit.item.id;
  (edit.item as Record<string, unknown>)[fieldName] = nextValue;

  if (fieldName === "id") {
    setSelectedSymbolInternalItems(
      elements,
      elements.selectedSymbolInternalItemIds.map((itemId) => itemId === previousItemId ? String(nextValue) : itemId),
      String(nextValue)
    );
  }

  commitSymbolEditorPayload(elements, edit.payload, documentRef);
  showSymbolWorkspaceStatus(elements, `Updated ${fieldName} for ${elements.selectedSymbolInternalItemId}`);
}

function updateSelectedSymbolInternalItemPart(
  elements: EditorElements,
  partId: string,
  documentRef: Document
): void {
  const edit = getSelectedSymbolInternalItemEdit(elements);

  if (!edit.ok) {
    renderSymbolWorkspaceError(elements, edit.message);
    return;
  }

  const nextPartId = partId.trim();
  const currentPartId = edit.item.partId ?? "";

  if (currentPartId === nextPartId) {
    return;
  }

  if (nextPartId && !(edit.symbol.parts ?? []).some((part) => part.id === nextPartId)) {
    showSymbolWorkspaceError(elements, `Part "${nextPartId}" is not defined on this symbol`);
    return;
  }

  recordHistory(elements);

  if (nextPartId.length === 0) {
    delete edit.item.partId;
  } else {
    edit.item.partId = nextPartId;
  }

  commitSymbolEditorPayload(elements, edit.payload, documentRef);
  showSymbolWorkspaceStatus(elements, nextPartId ? `Assigned ${edit.item.id} to ${nextPartId}` : `Removed part assignment from ${edit.item.id}`);
}

function createSymbolPartForSelectedItem(
  elements: EditorElements,
  rawPartId: string,
  documentRef: Document
): void {
  const edit = getSelectedSymbolInternalItemEdit(elements);

  if (!edit.ok) {
    renderSymbolWorkspaceError(elements, edit.message);
    return;
  }

  const partId = rawPartId.trim();

  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(partId)) {
    showSymbolWorkspaceError(elements, "New part id must start with a letter and use letters, numbers, _ or -");
    return;
  }

  if ((edit.symbol.parts ?? []).some((part) => part.id === partId)) {
    showSymbolWorkspaceError(elements, `Part "${partId}" already exists`);
    return;
  }

  recordHistory(elements);
  edit.symbol.parts = [
    ...(edit.symbol.parts ?? []),
    {
      id: partId,
      label: partId,
      itemIds: [edit.item.id]
    }
  ];
  edit.item.partId = partId;
  commitSymbolEditorPayload(elements, edit.payload, documentRef);
  showSymbolWorkspaceStatus(elements, `Created part ${partId} and assigned ${edit.item.id}`);
}

function updateSelectedSymbolInternalItemStyleField(
  elements: EditorElements,
  field: StyleFieldConfig,
  rawValue: string,
  documentRef: Document
): void {
  const edit = getSelectedSymbolInternalItemEdit(elements);

  if (!edit.ok) {
    renderSymbolWorkspaceError(elements, edit.message);
    return;
  }

  const parsedValue = parseStyleFieldValue(field, rawValue);

  if (!parsedValue.ok) {
    showSymbolWorkspaceError(elements, parsedValue.message);
    return;
  }

  const currentValue = edit.item.style?.[field.name];

  if (currentValue === parsedValue.value) {
    return;
  }

  recordHistory(elements);

  if (parsedValue.value === undefined) {
    delete edit.item.style?.[field.name];

    if (edit.item.style && Object.keys(edit.item.style).length === 0) {
      delete edit.item.style;
    }
  } else {
    edit.item.style = {
      ...edit.item.style,
      [field.name]: parsedValue.value
    };
  }

  commitSymbolEditorPayload(elements, edit.payload, documentRef);
  showSymbolWorkspaceStatus(elements, `Updated ${field.name} for ${edit.item.id}`);
}

function getSelectedSymbolInternalItemEdit(
  elements: EditorElements
): { ok: true; payload: SchematicPayload; symbol: SchematicSymbolDefinition; item: SchematicItem } | { ok: false; message: string } {
  const edit = getActiveSymbolEdit(elements);

  if (!edit.ok) {
    return edit;
  }

  const item = findSymbolInternalItem(edit.symbol, elements.selectedSymbolInternalItemId);

  if (!item) {
    return {
      ok: false,
      message: "Selected internal item was not found"
    };
  }

  return {
    ...edit,
    item
  };
}

function getActiveSymbolEdit(
  elements: EditorElements
): { ok: true; payload: SchematicPayload; symbol: SchematicSymbolDefinition } | { ok: false; message: string } {
  const result = parseAndValidatePayload(elements.jsonInput.value);

  if (!result.ok) {
    return result;
  }

  const symbol = getActiveSymbol(result.payload, elements.activeSymbolId);

  if (!symbol) {
    return {
      ok: false,
      message: "Selected symbol was not found"
    };
  }

  return {
    ok: true,
    payload: result.payload,
    symbol
  };
}

function commitSymbolEditorPayload(elements: EditorElements, payload: SchematicPayload, documentRef: Document): void {
  elements.jsonInput.value = formatPayloadJson(payload);
  updateFromJson(elements, documentRef);
  renderSymbolWorkspace(elements, documentRef);
}

function showSymbolWorkspaceStatus(elements: EditorElements, message: string): void {
  elements.symbolWorkspaceStatus.textContent = message;
  elements.symbolWorkspaceStatus.dataset.state = "valid";
}

function showSymbolWorkspaceError(elements: EditorElements, message: string): void {
  elements.symbolWorkspaceStatus.textContent = message;
  elements.symbolWorkspaceStatus.dataset.state = "error";
}

function clearSymbolSelection(elements: EditorElements, documentRef: Document): void {
  setSelectedSymbolInternalItems(elements, []);
  renderSymbolWorkspace(elements, documentRef);
}

function deleteSelectedSymbolInternalItem(elements: EditorElements, documentRef: Document): void {
  const edit = getActiveSymbolEdit(elements);

  if (!edit.ok) {
    renderSymbolWorkspaceError(elements, edit.message);
    return;
  }

  const itemIds = [...elements.selectedSymbolInternalItemIds];

  if (itemIds.length === 0) {
    showSymbolWorkspaceError(elements, "No symbol item selected");
    return;
  }

  recordHistory(elements);
  const removedIds: string[] = [];

  for (const itemId of itemIds) {
    const deleteResult = removeSymbolInternalItem(edit.symbol.items, itemId);

    if (deleteResult.removed) {
      removedIds.push(itemId);
      removeSymbolPartItemReferences(edit.symbol, itemId);
    }
  }

  if (removedIds.length === 0) {
    showSymbolWorkspaceError(elements, "Selected symbol items were not found");
    return;
  }

  setSelectedSymbolInternalItems(elements, []);
  commitSymbolEditorPayload(elements, edit.payload, documentRef);
  showSymbolWorkspaceStatus(elements, removedIds.length === 1 ? `Deleted ${removedIds[0]}` : `Deleted ${removedIds.length} symbol items`);
}

function removeSymbolInternalItem(items: SchematicItem[], itemId: string): { removed: boolean } {
  const index = items.findIndex((item) => item.id === itemId);

  if (index >= 0) {
    items.splice(index, 1);
    return { removed: true };
  }

  for (const item of items) {
    if (item.type !== "group") {
      continue;
    }

    const childResult = removeSymbolInternalItem(item.children, itemId);

    if (childResult.removed) {
      return childResult;
    }
  }

  return { removed: false };
}

function removeSymbolPartItemReferences(symbol: SchematicSymbolDefinition, itemId: string): void {
  for (const part of symbol.parts ?? []) {
    part.itemIds = part.itemIds?.filter((candidate) => candidate !== itemId);

    if (part.itemIds && part.itemIds.length === 0) {
      delete part.itemIds;
    }
  }
}

function getSymbolInternalItemEntries(items: SchematicItem[], depth = 0): SymbolInternalItemEntry[] {
  const entries: SymbolInternalItemEntry[] = [];

  for (const item of items) {
    entries.push({ item, depth });

    if (item.type === "group") {
      entries.push(...getSymbolInternalItemEntries(item.children, depth + 1));
    }
  }

  return entries;
}

function findSymbolInternalItem(symbol: SchematicSymbolDefinition, itemId: string | undefined): SchematicItem | undefined {
  if (!itemId) {
    return undefined;
  }

  return getSymbolInternalItemEntries(symbol.items).find((entry) => entry.item.id === itemId)?.item;
}

function moveSymbolItemFromStart(item: SchematicItem, startItem: SchematicItem, dx: number, dy: number): void {
  if (moveItemFromStart(item, startItem, dx, dy)) {
    return;
  }

  item.transform = moveGroupTransformFromStart(startItem, dx, dy);
}

function renderEmptySymbolWorkspace(elements: EditorElements, message: string): void {
  const documentRef = elements.editorRoot.ownerDocument;
  elements.symbolPreviewSurface.replaceChildren(createSymbolWorkspaceEmpty(documentRef, message));
  elements.symbolItemList.replaceChildren(createSymbolWorkspaceEmpty(documentRef, message));
  elements.symbolPartsList.replaceChildren(createSymbolWorkspaceEmpty(documentRef, "No parts"));
  elements.symbolSlotsList.replaceChildren(createSymbolWorkspaceEmpty(documentRef, "No entity slots"));
  elements.symbolInspector.replaceChildren(createSymbolWorkspaceEmpty(documentRef, "Create a symbol to inspect it"));
}

function renderSymbolWorkspaceError(elements: EditorElements, message: string): void {
  const documentRef = elements.editorRoot.ownerDocument;
  const error = createSymbolWorkspaceEmpty(documentRef, message);
  error.dataset.state = "error";
  elements.symbolPreviewSurface.replaceChildren(error);
  elements.symbolItemList.replaceChildren();
  elements.symbolPartsList.replaceChildren();
  elements.symbolSlotsList.replaceChildren();
  elements.symbolInspector.replaceChildren(error.cloneNode(true));
}

function createSymbolWorkspaceEmpty(documentRef: Document, message: string): HTMLElement {
  const empty = documentRef.createElement("div");
  empty.className = "symbol-workspace-empty";
  empty.textContent = message;
  return empty;
}

function highlightSelectedSymbolInternalItem(elements: EditorElements): void {
  for (const element of elements.symbolPreviewSurface.querySelectorAll("[data-symbol-editor-selected]")) {
    element.removeAttribute("data-symbol-editor-selected");
  }

  if (elements.selectedSymbolInternalItemIds.length === 0) {
    return;
  }

  const selectedIds = new Set(elements.selectedSymbolInternalItemIds);

  for (const element of elements.symbolPreviewSurface.querySelectorAll("[data-id]")) {
    const itemId = element.getAttribute("data-id");

    if (itemId && selectedIds.has(itemId)) {
      element.setAttribute("data-symbol-editor-selected", "true");
    }
  }
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

  if (!elements.symbolWorkspace.hidden && elements.symbolWorkspaceStarted) {
    if (event.key === "Escape") {
      event.preventDefault();
      clearSymbolSelection(elements, documentRef);
      return;
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      deleteSelectedSymbolInternalItem(elements, documentRef);
      return;
    }
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
    || (item.type === "polyline" && item.points.length > 0)
    || item.type === "group";
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

  if (item.type === "group") {
    moveGroupTransform(item, dx, dy);
    return true;
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

  if (item.type === "group" && startItem.type === "group") {
    item.transform = moveGroupTransformFromStart(startItem, dx, dy);
    return true;
  }

  return false;
}

function moveGroupTransform(item: SchematicItem, dx: number, dy: number): void {
  if (item.type !== "group") {
    return;
  }

  item.transform = moveGroupTransformFromStart(item, dx, dy);
}

function moveGroupTransformFromStart(item: SchematicItem, dx: number, dy: number): SchematicItem["transform"] {
  if (item.type !== "group") {
    return undefined;
  }

  const transform = [...(item.transform ?? [])];
  const translateIndex = transform.findIndex((entry) => entry.type === "translate");

  if (translateIndex === -1) {
    return [
      { type: "translate", x: dx, y: dy },
      ...transform
    ];
  }

  const translate = transform[translateIndex];

  if (translate?.type !== "translate") {
    return transform;
  }

  transform[translateIndex] = {
    ...translate,
    x: translate.x + dx,
    y: translate.y + dy
  };
  return transform;
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

  if (item.type === "group") {
    snapGroupTransform(item, gridSize);
    return true;
  }

  return false;
}

function snapGroupTransform(item: SchematicItem, gridSize: number): void {
  if (item.type !== "group") {
    return;
  }

  const transform = [...(item.transform ?? [])];
  const translateIndex = transform.findIndex((entry) => entry.type === "translate");
  const translate = transform[translateIndex];

  if (translate?.type !== "translate") {
    item.transform = [
      { type: "translate", x: 0, y: 0 },
      ...transform
    ];
    return;
  }

  transform[translateIndex] = {
    ...translate,
    x: snapNumber(translate.x, gridSize),
    y: snapNumber(translate.y, gridSize)
  };
  item.transform = transform;
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

function importSvgMarkup(elements: EditorElements, documentRef: Document): void {
  const payloadResult = parseAndValidatePayload(elements.jsonInput.value);

  if (!payloadResult.ok) {
    elements.status.textContent = `SVG import error:\n${payloadResult.message}`;
    elements.status.dataset.state = "error";
    return;
  }

  const importResult = parseSvgImport(elements.svgImportInput.value, payloadResult.payload, documentRef);

  if (!importResult.ok) {
    elements.status.textContent = `SVG import error:\n${importResult.errors.map((error) => `- ${error}`).join("\n")}`;
    elements.status.dataset.state = "error";
    return;
  }

  if (importResult.items.length === 0) {
    elements.status.textContent = "SVG import skipped: no supported SVG primitives found";
    elements.status.dataset.state = "error";
    return;
  }

  const nextPayload = {
    ...payloadResult.payload,
    items: [
      ...payloadResult.payload.items,
      ...importResult.items
    ]
  };
  const validation = validateSchematicPayload(nextPayload);

  if (!validation.valid) {
    elements.status.textContent = `SVG import error:\n${validation.errors.map((error) => `- ${error}`).join("\n")}`;
    elements.status.dataset.state = "error";
    return;
  }

  recordHistory(elements);
  setSelectedItems(elements, importResult.items.map((item) => item.id));
  elements.jsonInput.value = formatPayloadJson(nextPayload);
  updateFromJson(elements, documentRef);
  elements.status.textContent = importResult.warnings.length === 0
    ? `Imported ${importResult.items.length} SVG items`
    : `Imported ${importResult.items.length} SVG items\n${importResult.warnings.map((warning) => `- ${warning}`).join("\n")}`;
  elements.status.dataset.state = "valid";
}

export function parseSvgImport(markup: string, payload: SchematicPayload, documentRef: Document = document): SvgImportResult {
  if (markup.trim().length === 0) {
    return {
      ok: false,
      errors: ["SVG markup is required"]
    };
  }

  const DOMParserConstructor = documentRef.defaultView?.DOMParser ?? globalThis.DOMParser;

  if (!DOMParserConstructor) {
    return {
      ok: false,
      errors: ["DOMParser is unavailable in this browser"]
    };
  }

  const parsed = new DOMParserConstructor().parseFromString(markup, "image/svg+xml");
  const parserError = parsed.querySelector("parsererror");

  if (parserError) {
    return {
      ok: false,
      errors: ["SVG markup could not be parsed"]
    };
  }

  const root = parsed.documentElement;

  if (!root || root.tagName.toLowerCase() !== "svg") {
    return {
      ok: false,
      errors: ["SVG markup must start with an <svg> element"]
    };
  }

  const safetyErrors = findUnsafeSvgContent(root);

  if (safetyErrors.length > 0) {
    return {
      ok: false,
      errors: safetyErrors
    };
  }

  const warnings: string[] = [];
  const existingIds = new Set(payload.items.map((item) => item.id));
  const classStyles = parseSvgClassStyles(root, warnings);
  const items = convertSvgChildren(root, {
    existingIds,
    classStyles,
    warnings
  });
  const groupedItems = groupImportedSvgItems(root, payload, existingIds, items);

  return {
    ok: true,
    items: groupedItems,
    warnings
  };
}

function findUnsafeSvgContent(root: Element): string[] {
  const errors: string[] = [];
  const elements = [root, ...Array.from(root.querySelectorAll("*"))];

  for (const element of elements) {
    const tagName = element.tagName.toLowerCase();

    if (UNSAFE_SVG_TAGS.has(tagName) && tagName !== "style") {
      errors.push(`<${tagName}> is not supported for safe SVG import`);
    }

    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.toLowerCase();

      if (name.startsWith("on")) {
        errors.push(`${tagName}.${attribute.name} event handlers are not supported`);
      } else if (name === "style") {
        errors.push(`${tagName}.style is not supported; use presentation attributes instead`);
      } else if (name === "href" || name === "xlink:href" || name === "src") {
        errors.push(`${tagName}.${attribute.name} external references are not supported`);
      } else if (value.includes("javascript:") || value.includes("url(") || value.includes("<") || value.includes(">")) {
        errors.push(`${tagName}.${attribute.name} contains unsupported or unsafe content`);
      }
    }
  }

  return [...new Set(errors)];
}

function convertSvgChildren(root: Element, context: SvgImportContext): SchematicItem[] {
  const items: SchematicItem[] = [];

  for (const child of Array.from(root.children)) {
    convertSvgElement(child, context, items);
  }

  return items;
}

function convertSvgElement(
  element: Element,
  context: SvgImportContext,
  items: SchematicItem[]
): void {
  const tagName = element.tagName.toLowerCase();

  if (tagName === "g" || tagName === "svg") {
    for (const child of Array.from(element.children)) {
      convertSvgElement(child, context, items);
    }
    return;
  }

  if (tagName === "style") {
    return;
  }

  if (!SUPPORTED_SVG_IMPORT_TAGS.has(tagName)) {
    context.warnings.push(`Skipped unsupported <${tagName}> element`);
    return;
  }

  const item = createItemFromSvgElement(element, context, items.length);

  if (!item) {
    context.warnings.push(`Skipped <${tagName}> element with missing or invalid required attributes`);
    return;
  }

  items.push(item);
}

function groupImportedSvgItems(
  root: Element,
  payload: SchematicPayload,
  existingIds: Set<string>,
  items: SchematicItem[]
): SchematicItem[] {
  if (items.length === 0) {
    return items;
  }

  const sourceViewBox = readSvgSourceViewBox(root) ?? getBoundsFromItems(items);

  if (!sourceViewBox) {
    return items;
  }

  const targetSize = Math.max(24, Math.min(payload.viewport.width, payload.viewport.height) * 0.35);
  const sourceMaxDimension = Math.max(sourceViewBox.width, sourceViewBox.height);
  const scale = sourceMaxDimension > 0 ? targetSize / sourceMaxDimension : 1;
  const targetX = Math.round((payload.viewport.width - sourceViewBox.width * scale) / 2);
  const targetY = Math.round((payload.viewport.height - sourceViewBox.height * scale) / 2);
  const transform = [
    {
      type: "translate" as const,
      x: targetX,
      y: targetY
    },
    {
      type: "scale" as const,
      x: Number(scale.toFixed(4))
    },
    {
      type: "translate" as const,
      x: -sourceViewBox.x,
      y: -sourceViewBox.y
    }
  ];

  return [
    {
      id: createImportedSvgItemId(existingIds, root.getAttribute("id"), "svg", 0),
      type: "group",
      layer: 300,
      transform,
      children: items
    }
  ];
}

function readSvgSourceViewBox(root: Element): PreviewViewBox | undefined {
  const viewBox = root.getAttribute("viewBox");

  if (viewBox) {
    const values = viewBox.trim().split(/[\s,]+/).map((part) => Number(part));

    if (values.length === 4 && values.every((value) => Number.isFinite(value)) && values[2]! > 0 && values[3]! > 0) {
      return {
        x: values[0]!,
        y: values[1]!,
        width: values[2]!,
        height: values[3]!
      };
    }
  }

  const width = readSvgNumber(root, "width");
  const height = readSvgNumber(root, "height");

  if (width !== undefined && height !== undefined && width > 0 && height > 0) {
    return {
      x: 0,
      y: 0,
      width,
      height
    };
  }

  return undefined;
}

function createItemFromSvgElement(element: Element, context: SvgImportContext, index: number): SchematicItem | undefined {
  const tagName = element.tagName.toLowerCase();
  const id = createImportedSvgItemId(context.existingIds, element.getAttribute("id"), tagName, index);
  const style = readSafeSvgStyle(element, context.classStyles);

  switch (tagName) {
    case "rect": {
      const x = readSvgNumber(element, "x", 0);
      const y = readSvgNumber(element, "y", 0);
      const width = readSvgNumber(element, "width");
      const height = readSvgNumber(element, "height");

      if (width === undefined || height === undefined) {
        return undefined;
      }

      return removeUndefinedProperties({
        id,
        type: "rect",
        layer: 300,
        x,
        y,
        width,
        height,
        rx: readSvgNumber(element, "rx"),
        ry: readSvgNumber(element, "ry"),
        style
      }) as SchematicItem;
    }
    case "circle": {
      const cx = readSvgNumber(element, "cx");
      const cy = readSvgNumber(element, "cy");
      const r = readSvgNumber(element, "r");

      if (cx === undefined || cy === undefined || r === undefined) {
        return undefined;
      }

      return removeUndefinedProperties({
        id,
        type: "circle",
        layer: 300,
        cx,
        cy,
        r,
        style
      }) as SchematicItem;
    }
    case "line": {
      const x1 = readSvgNumber(element, "x1");
      const y1 = readSvgNumber(element, "y1");
      const x2 = readSvgNumber(element, "x2");
      const y2 = readSvgNumber(element, "y2");

      if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) {
        return undefined;
      }

      return removeUndefinedProperties({
        id,
        type: "line",
        layer: 100,
        x1,
        y1,
        x2,
        y2,
        style
      }) as SchematicItem;
    }
    case "polyline":
    case "polygon": {
      const points = readSvgPoints(element.getAttribute("points"), tagName === "polygon");

      if (points.length < 2) {
        return undefined;
      }

      return removeUndefinedProperties({
        id,
        type: "polyline",
        layer: 100,
        points,
        style
      }) as SchematicItem;
    }
    case "path": {
      const d = element.getAttribute("d")?.trim();

      if (!d) {
        return undefined;
      }

      return removeUndefinedProperties({
        id,
        type: "path",
        layer: 100,
        d,
        style
      }) as SchematicItem;
    }
    case "text": {
      const x = readSvgNumber(element, "x");
      const y = readSvgNumber(element, "y");
      const text = element.textContent?.trim();

      if (x === undefined || y === undefined || !text) {
        return undefined;
      }

      return removeUndefinedProperties({
        id,
        type: "text",
        layer: 600,
        x,
        y,
        text,
        style
      }) as SchematicItem;
    }
    default:
      return undefined;
  }
}

function createImportedSvgItemId(existingIds: Set<string>, sourceId: string | null, tagName: string, index: number): string {
  const baseId = sanitizeImportedSvgId(sourceId) ?? `imported-${tagName}-${index + 1}`;
  let candidate = baseId;
  let suffix = 2;

  while (existingIds.has(candidate)) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }

  existingIds.add(candidate);
  return candidate;
}

function sanitizeImportedSvgId(value: string | null): string | undefined {
  const trimmed = value?.trim();

  if (!trimmed || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(trimmed)) {
    return undefined;
  }

  return trimmed;
}

function readSvgNumber(element: Element, attribute: string, fallback?: number): number | undefined {
  const value = element.getAttribute(attribute);

  if (value === null || value.trim().length === 0) {
    return fallback;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function readSvgPoints(value: string | null, closePolygon: boolean): SchematicPoint[] {
  if (!value) {
    return [];
  }

  const numbers = value
    .trim()
    .split(/[\s,]+/)
    .map((part) => Number(part));

  if (numbers.length < 4 || numbers.length % 2 !== 0 || numbers.some((numberValue) => !Number.isFinite(numberValue))) {
    return [];
  }

  const points: SchematicPoint[] = [];

  for (let index = 0; index < numbers.length; index += 2) {
    points.push({
      x: numbers[index],
      y: numbers[index + 1]
    });
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  if (closePolygon && firstPoint && lastPoint && (firstPoint.x !== lastPoint.x || firstPoint.y !== lastPoint.y)) {
    points.push({ ...firstPoint });
  }

  return points;
}

function parseSvgClassStyles(root: Element, warnings: string[]): Map<string, SchematicStyle> {
  const classStyles = new Map<string, SchematicStyle>();

  for (const styleElement of Array.from(root.querySelectorAll("style"))) {
    const styleText = styleElement.textContent ?? "";

    if (styleText.includes("@") || /url\s*\(/i.test(styleText) || /javascript\s*:/i.test(styleText)) {
      warnings.push("Skipped unsafe or unsupported SVG <style> content");
      continue;
    }

    const rulePattern = /\.([A-Za-z][A-Za-z0-9_-]*)\s*\{([^{}]*)\}/g;
    let match: RegExpExecArray | null;

    while ((match = rulePattern.exec(styleText)) !== null) {
      const className = match[1]!;
      const declarations = match[2]!;
      const style = parseSvgStyleDeclarations(declarations);

      if (Object.keys(style).length > 0) {
        classStyles.set(className, style);
      }
    }
  }

  return classStyles;
}

function parseSvgStyleDeclarations(declarations: string): SchematicStyle {
  const style: SchematicStyle = {};

  for (const declaration of declarations.split(";")) {
    const separatorIndex = declaration.indexOf(":");

    if (separatorIndex === -1) {
      continue;
    }

    const property = declaration.slice(0, separatorIndex).trim().toLowerCase();
    const value = declaration.slice(separatorIndex + 1).trim();

    if (!SAFE_SVG_STYLE_ATTRIBUTES.has(property) || isUnsafeSvgStyleValue(value)) {
      continue;
    }

    applySafeSvgStyleAttribute(style, property, value);
  }

  return style;
}

function readSafeSvgStyle(element: Element, classStyles: Map<string, SchematicStyle>): SchematicStyle | undefined {
  const style: SchematicStyle = {};

  for (const className of (element.getAttribute("class") ?? "").split(/\s+/).filter((value) => value.length > 0)) {
    Object.assign(style, classStyles.get(className));
  }

  for (const attribute of Array.from(element.attributes)) {
    const name = attribute.name.toLowerCase();

    if (!SAFE_SVG_STYLE_ATTRIBUTES.has(name)) {
      continue;
    }

    if (isUnsafeSvgStyleValue(attribute.value)) {
      continue;
    }

    applySafeSvgStyleAttribute(style, name, attribute.value.trim());
  }

  return Object.keys(style).length === 0 ? undefined : style;
}

function isUnsafeSvgStyleValue(value: string): boolean {
  const lowerValue = value.toLowerCase();
  return lowerValue.includes("javascript:")
    || lowerValue.includes("url(")
    || lowerValue.includes("<")
    || lowerValue.includes(">");
}

function applySafeSvgStyleAttribute(style: SchematicStyle, name: string, value: string): void {
  switch (name) {
    case "stroke":
      style.stroke = value;
      break;
    case "stroke-width":
      assignNumberStyle(style, "strokeWidth", value);
      break;
    case "stroke-dasharray":
      style.strokeDasharray = value;
      break;
    case "fill":
      style.fill = value;
      break;
    case "opacity":
      assignNumberStyle(style, "opacity", value);
      break;
    case "font-size":
      assignNumberStyle(style, "fontSize", value);
      break;
    case "font-weight": {
      const numberValue = Number(value);
      if (Number.isFinite(numberValue)) {
        style.fontWeight = numberValue;
      } else if (value === "normal" || value === "bold") {
        style.fontWeight = value;
      }
      break;
    }
    case "text-anchor":
      if (value === "start" || value === "middle" || value === "end") {
        style.textAnchor = value;
      }
      break;
  }
}

function assignNumberStyle<T extends "strokeWidth" | "opacity" | "fontSize">(
  style: SchematicStyle,
  key: T,
  value: string
): void {
  const numberValue = Number(value);

  if (Number.isFinite(numberValue)) {
    style[key] = numberValue;
  }
}

function removeUndefinedProperties<T extends Record<string, unknown>>(value: T): T {
  for (const key of Object.keys(value)) {
    if (value[key] === undefined) {
      delete value[key];
    }
  }

  return value;
}

function applyThemePreview(elements: EditorElements): void {
  const result = parseThemeVariables(elements.themeInput.value);

  if (!result.ok) {
    elements.themeStatus.textContent = result.message;
    elements.themeStatus.dataset.state = "error";
    return;
  }

  getEditorLocalStorage(elements)?.setItem(THEME_STORAGE_KEY, elements.themeInput.value);
  elements.themePreviewToggle.checked = true;
  applyThemeVariablesToPreview(elements, result.variables);

  elements.themeStatus.textContent = `Applied ${Object.keys(result.variables).length} theme variables`;
  elements.themeStatus.dataset.state = "valid";
}

function updateThemePreviewMode(elements: EditorElements): void {
  if (!elements.themePreviewToggle.checked) {
    clearThemePreviewVariables(elements);
    elements.themeStatus.textContent = "Using editor theme";
    elements.themeStatus.dataset.state = "valid";
    return;
  }

  const result = parseThemeVariables(elements.themeInput.value);

  if (!result.ok) {
    elements.themePreviewToggle.checked = false;
    elements.themeStatus.textContent = result.message;
    elements.themeStatus.dataset.state = "error";
    return;
  }

  applyThemeVariablesToPreview(elements, result.variables);
  elements.themeStatus.textContent = `Previewing ${Object.keys(result.variables).length} imported theme variables`;
  elements.themeStatus.dataset.state = "valid";
}

function applyThemeVariablesToPreview(elements: EditorElements, variables: Record<string, string>): void {
  clearThemePreviewVariables(elements);

  for (const [name, value] of Object.entries(variables)) {
    elements.previewSurface.style.setProperty(name, value);
  }
}

function clearThemePreviewVariables(elements: EditorElements): void {
  elements.previewSurface.removeAttribute("style");
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

function openTransferPanel(elements: EditorElements, mode: "import" | "svg" | "export" | "theme"): void {
  openFloatingPanel(elements.editorRoot, "transfer");
  elements.transferPanel.hidden = false;
  elements.transferPanel.dataset.mode = mode;
  elements.transferPanelTitle.textContent = getTransferPanelTitle(mode);
  elements.importSection.hidden = mode !== "import";
  elements.svgImportSection.hidden = mode !== "svg";
  elements.exportSection.hidden = mode !== "export";
  elements.themeInput.closest<HTMLElement>(".theme-section")!.hidden = mode !== "theme";
}

function getTransferPanelTitle(mode: "import" | "svg" | "export" | "theme"): string {
  switch (mode) {
    case "import":
      return "Import Payload";
    case "svg":
      return "Import SVG";
    case "export":
      return "Export Payload";
    case "theme":
      return "Theme Preview";
  }
}

function closeTransferPanel(elements: EditorElements): void {
  elements.transferPanel.hidden = true;
  delete elements.transferPanel.dataset.mode;
  closeFloatingPanel(elements.editorRoot, "transfer");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function createJsonPane(documentRef: Document): HTMLElement {
  const pane = createPane(documentRef, "Editor");
  pane.classList.add("editor-sidebar");

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

  const jsonActions = documentRef.createElement("div");
  jsonActions.className = "json-editor-actions";

  const formatButton = createToolbarButton(documentRef, "format-button", "Format JSON", "{}");
  const resetButton = createToolbarButton(documentRef, "reset-button", "Reset demo", "↺");
  jsonActions.append(formatButton, resetButton);

  itemListSection.append(itemListLabel, itemList, symbolSummary);
  inspectorSection.append(inspectorLabel, inspector, inspectorStatus);
  jsonSection.append(jsonActions, jsonInput);
  primaryPanel.append(itemListSection, inspectorSection, jsonSection);
  dockedPanel.append(dockedPanelTab);
  itemTools.append(tabList, primaryPanel, tabDropZone, dockedPanel);
  pane.append(itemTools);
  return pane;
}

function createEditorRail(documentRef: Document): HTMLElement {
  const rail = documentRef.createElement("nav");
  rail.className = "editor-rail odysseus-shell-nav sidebar";
  rail.id = "sidebar";
  rail.setAttribute("aria-label", "Editor navigation");

  const toggleButton = documentRef.createElement("button");
  toggleButton.className = "sidebar-toggle-button hamburger-btn";
  toggleButton.type = "button";
  toggleButton.title = "Toggle sidebar";
  toggleButton.setAttribute("aria-label", "Toggle sidebar");
  toggleButton.setAttribute("aria-expanded", "false");

  for (let index = 0; index < 3; index += 1) {
    const line = documentRef.createElement("span");
    line.className = "sidebar-toggle-line";
    toggleButton.append(line);
  }

  const header = documentRef.createElement("div");
  header.className = "sidebar-header";
  const brand = documentRef.createElement("div");
  brand.className = "sidebar-brand";
  const brandTitle = documentRef.createElement("span");
  brandTitle.className = "sidebar-brand-title";
  brandTitle.textContent = "HSC";
  brand.append(brandTitle);
  header.append(brand);

  const inner = documentRef.createElement("div");
  inner.className = "sidebar-inner";
  inner.append(
    createSidebarSection(documentRef, "editor-mode-card", "Card editor", "Card editor", [
      createWorkspaceSidebarButton(documentRef, "Card editor", "▣", "Main schematic workspace", "card", "list-item"),
      createWorkspaceSidebarButton(documentRef, "Symbol editor", "◇", "Symbol workspace", "symbol", "list-item open-symbol-editor-button")
    ]),
    createSidebarSection(documentRef, "tools-section", "Tools", "Tools", [
      createNavSidebarTabButton(documentRef, "Inspector", "⌁", "Selected item properties", "inspector", "list-item card-tool"),
      createNavSidebarTabButton(documentRef, "Item List", "☷", "Objects and schematic items", "items", "list-item card-tool"),
      createNavSidebarTabButton(documentRef, "JSON Editor", "{}", "Raw payload editing", "json", "list-item card-tool"),
      createNavSidebarTransferButton(documentRef, "Import Payload", "⇣", "Paste encoded hsc1 payload", "import", "list-item card-tool"),
      createNavSidebarTransferButton(documentRef, "Import SVG", "SVG", "Convert safe SVG primitives", "svg", "list-item card-tool"),
      createNavSidebarTransferButton(documentRef, "Export / Payload", "⇄", "Encoded card payload", "export", "list-item card-tool"),
      createNavSidebarPanelButton(documentRef, "Simulation", "∿", "Open item state workspace", "inspector", undefined, "list-item card-tool"),
      createNavSidebarTabButton(documentRef, "Layers / Object Tree", "▤", "Layer order and object list", "items", "list-item card-tool"),
      createNavSidebarTransferButton(documentRef, "Theme / Preview", "◐", "Imported HA theme controls", "theme", "list-item card-tool")
    ]),
    createSidebarSection(documentRef, "editor-mode-symbol", "Symbol editor", "Symbol editor", [
      createSymbolSidebarButton(documentRef, "Symbol Items", "☷", "Internal symbol objects", "items"),
      createSymbolSidebarButton(documentRef, "Symbol Parts", "▧", "Part definitions", "parts"),
      createSymbolSidebarButton(documentRef, "Symbol Slots", "◌", "Slot simulation states", "slots")
    ])
  );

  rail.append(toggleButton, header, inner);
  return rail;
}

function createWorkspaceSidebarButton(
  documentRef: Document,
  label: string,
  icon: string,
  description: string,
  workspace: WorkspaceMode,
  variantClassName?: string
): HTMLButtonElement {
  const button = createNavSidebarButton(documentRef, label, icon, description, variantClassName);
  button.dataset.workspaceMode = workspace;
  return button;
}

function createSymbolSidebarButton(
  documentRef: Document,
  label: string,
  icon: string,
  description: string,
  tab: SymbolEditorTabName
): HTMLButtonElement {
  const button = createNavSidebarButton(documentRef, label, icon, description, "list-item symbol-tool");
  button.dataset.workspaceMode = "symbol";
  button.dataset.symbolPanelShortcut = tab;
  return button;
}

function createNavSidebarPanelButton(
  documentRef: Document,
  label: string,
  icon: string,
  description: string,
  panelId: FloatingPanelId,
  extraClassName?: string,
  variantClassName?: string
): HTMLButtonElement {
  const button = createNavSidebarButton(documentRef, label, icon, description, variantClassName);
  if (extraClassName) {
    button.classList.add(extraClassName);
  }
  button.dataset.openPanel = panelId;
  return button;
}

function createNavSidebarTabButton(
  documentRef: Document,
  label: string,
  icon: string,
  description: string,
  tab: EditorTabName,
  variantClassName?: string
): HTMLButtonElement {
  const button = createNavSidebarButton(documentRef, label, icon, description, variantClassName);
  button.dataset.openPanel = getEditorTabPanelId(tab);
  button.dataset.editorTabShortcut = tab;
  return button;
}

function createNavSidebarTransferButton(
  documentRef: Document,
  label: string,
  icon: string,
  description: string,
  mode: TransferPanelMode,
  variantClassName?: string
): HTMLButtonElement {
  const button = createNavSidebarButton(documentRef, label, icon, description, variantClassName);
  button.dataset.transferMode = mode;
  return button;
}

function createNavSidebarButton(
  documentRef: Document,
  label: string,
  icon: string,
  description: string,
  variantClassName?: string
): HTMLButtonElement {
  const button = documentRef.createElement("button");
  button.className = `editor-nav-entry ${variantClassName ?? ""}`.trim();
  button.type = "button";
  button.title = label;
  button.setAttribute("aria-label", label);

  const iconElement = documentRef.createElement("span");
  iconElement.className = "editor-nav-entry-icon";
  iconElement.textContent = icon;

  const textWrap = documentRef.createElement("span");
  textWrap.className = "editor-nav-entry-text";

  const labelElement = documentRef.createElement("span");
  labelElement.className = "editor-nav-entry-label";
  labelElement.textContent = label;

  const descriptionElement = documentRef.createElement("span");
  descriptionElement.className = "editor-nav-entry-description";
  descriptionElement.textContent = description;

  textWrap.append(labelElement, descriptionElement);
  button.append(iconElement, textWrap);
  return button;
}

function createSidebarSection(
  documentRef: Document,
  id: string,
  title: string,
  iconLabel: string,
  buttons: HTMLButtonElement[]
): HTMLElement {
  const section = documentRef.createElement("section");
  section.className = "section";
  section.id = id;

  const header = documentRef.createElement("div");
  header.className = "section-header-flex";

  const icon = documentRef.createElement("span");
  icon.className = "section-icon";
  icon.textContent = iconLabel.slice(0, 2);

  const heading = documentRef.createElement("h4");
  heading.className = "section-title";
  heading.textContent = title;

  header.append(icon, heading);
  section.append(header, ...buttons);
  return section;
}

function toggleEditorSidebar(shell: HTMLElement, button: HTMLButtonElement): void {
  const isExpanded = shell.dataset.sidebar !== "collapsed";
  shell.dataset.sidebar = isExpanded ? "collapsed" : "expanded";
  button.setAttribute("aria-expanded", String(!isExpanded));
}

function createGlobalToolbar(documentRef: Document): HTMLElement {
  const toolbar = documentRef.createElement("header");
  toolbar.className = "editor-topbar card-editor-toolbar";
  toolbar.setAttribute("aria-label", "Card editor tools");

  const toolGroup = createToolbarGroup(documentRef, "TOOL");

  const selectToolButton = createToolbarButton(documentRef, "select-tool-button", "Select", "↖");
  selectToolButton.setAttribute("aria-pressed", "true");

  const panToolButton = createToolbarButton(documentRef, "pan-tool-button", "Pan", "✥");
  panToolButton.setAttribute("aria-pressed", "false");

  const drawPolylineButton = createToolbarButton(documentRef, "draw-polyline-button", "Polyline", "⌁");
  drawPolylineButton.setAttribute("aria-pressed", "false");

  const finishPolylineButton = createToolbarButton(documentRef, "finish-polyline-button", "Finish polyline", "✓");
  finishPolylineButton.hidden = true;

  appendToolbarActions(toolGroup, selectToolButton, panToolButton, drawPolylineButton, finishPolylineButton);

  const addGroup = createToolbarGroup(documentRef, "ADD");
  appendToolbarActions(
    addGroup,
    createToolbarButton(documentRef, "add-text-button", "Text", "T"),
    createToolbarButton(documentRef, "add-rect-button", "Rectangle", "▭"),
    createToolbarButton(documentRef, "add-circle-button", "Circle", "○")
  );

  const editGroup = createToolbarGroup(documentRef, "EDIT");
  const duplicateItemButton = createToolbarButton(documentRef, "duplicate-item-button", "Duplicate", "⧉");
  duplicateItemButton.disabled = true;
  const deleteItemButton = createToolbarButton(documentRef, "delete-item-button", "Delete", "×");
  deleteItemButton.disabled = true;
  const undoButton = createToolbarButton(documentRef, "undo-button", "Undo", "↶");
  undoButton.disabled = true;
  const redoButton = createToolbarButton(documentRef, "redo-button", "Redo", "↷");
  redoButton.disabled = true;
  appendToolbarActions(editGroup, duplicateItemButton, deleteItemButton, undoButton, redoButton);

  const viewGroup = createToolbarGroup(documentRef, "VIEW");
  const toggleGridButton = createToolbarButton(documentRef, "toggle-grid-button", "Grid on", "▦");
  toggleGridButton.setAttribute("aria-pressed", "true");
  const toggleSnapButton = createToolbarButton(documentRef, "toggle-snap-button", "Snap on", "⌖");
  toggleSnapButton.setAttribute("aria-pressed", "true");
  const gridSizeLabel = documentRef.createElement("label");
  gridSizeLabel.className = "grid-size-field";
  const gridSizeText = documentRef.createElement("span");
  gridSizeText.className = "field-label";
  gridSizeText.textContent = "GRID";
  const gridSizeInput = documentRef.createElement("input");
  gridSizeInput.className = "grid-size-input";
  gridSizeInput.type = "number";
  gridSizeInput.min = "1";
  gridSizeInput.step = "1";
  gridSizeInput.value = String(DEFAULT_EDITOR_GRID_SIZE);
  gridSizeInput.setAttribute("aria-label", "Grid size");
  gridSizeLabel.append(gridSizeText, gridSizeInput);
  const resetViewButton = createToolbarButton(documentRef, "reset-view-button", "Fit view", "⛶");
  appendToolbarActions(viewGroup, toggleGridButton, toggleSnapButton, gridSizeLabel, resetViewButton);

  toolbar.append(toolGroup, addGroup, editGroup, viewGroup);
  return toolbar;
}

function createToolbarGroup(documentRef: Document, label: string): HTMLElement {
  const group = documentRef.createElement("section");
  group.className = "toolbar-group";
  group.setAttribute("aria-label", label);

  const groupLabel = documentRef.createElement("span");
  groupLabel.className = "toolbar-group-label";
  groupLabel.textContent = label;

  const actions = documentRef.createElement("div");
  actions.className = "toolbar-group-actions";

  group.append(groupLabel, actions);
  return group;
}

function appendToolbarActions(group: HTMLElement, ...actions: Array<HTMLElement>): void {
  getRequiredElement(group, ".toolbar-group-actions", HTMLElement).append(...actions);
}

function createToolbarButton(documentRef: Document, className: string, label: string, icon = label): HTMLButtonElement {
  const button = documentRef.createElement("button");
  button.className = `${className} utility-button toolbar-icon-button`;
  button.type = "button";
  button.textContent = icon;
  button.title = label;
  button.setAttribute("aria-label", label);
  return button;
}

function createFloatingPanelLayer(
  documentRef: Document,
  content: {
    itemListSection: HTMLElement;
    inspectorSection: HTMLElement;
    jsonSection: HTMLElement;
    transferPanel: HTMLElement;
  }
): HTMLElement {
  const layer = documentRef.createElement("div");
  layer.className = "floating-panel-layer";

  const dockZones = documentRef.createElement("div");
  dockZones.className = "floating-panel-dock-zones";
  dockZones.append(
    createFloatingPanelDockZone(documentRef, "left"),
    createFloatingPanelDockZone(documentRef, "right"),
    createFloatingPanelDockZone(documentRef, "bottom")
  );

  const tileGhost = documentRef.createElement("div");
  tileGhost.id = "tile-ghost";
  tileGhost.className = "floating-panel-tile-ghost";

  const panels = documentRef.createElement("div");
  panels.className = "floating-panels";
  panels.append(
    createFloatingPanel(documentRef, "items", "Item List / Object Tree", "☷", content.itemListSection, { x: 24, y: 132 }, "closed"),
    createFloatingPanel(documentRef, "inspector", "Inspector", "⌁", content.inspectorSection, { x: 720, y: 18 }, "closed"),
    createFloatingPanel(documentRef, "json", "JSON Editor", "{}", content.jsonSection, { x: 720, y: 360 }, "closed"),
    createFloatingPanel(documentRef, "transfer", "Export / Payload", "⇄", content.transferPanel, { x: 180, y: 96 }, "closed")
  );

  const dock = documentRef.createElement("div");
  dock.className = "floating-panel-dock";
  dock.id = "minimized-dock";
  dock.setAttribute("aria-label", "Minimized panels");

  layer.append(dockZones, tileGhost, panels, dock);
  return layer;
}

function createFloatingPanelDockZone(documentRef: Document, zone: FloatingPanelDockZone): HTMLElement {
  const target = documentRef.createElement("div");
  target.className = `floating-panel-dock-zone floating-panel-dock-zone-${zone}`;
  target.dataset.dockZone = zone;
  target.setAttribute("aria-label", `${zone} dock zone`);
  return target;
}

function createFloatingPanel(
  documentRef: Document,
  panelId: FloatingPanelId,
  title: string,
  badge: string,
  content: HTMLElement,
  position: { x: number; y: number },
  initialState: "open" | "closed" | "maximized" = "open"
): HTMLElement {
  const panel = documentRef.createElement("section");
  panel.className = `floating-panel modal modal-content floating-panel-${panelId}`;
  panel.dataset.panelId = panelId;
  panel.dataset.panelState = initialState;
  panel.style.left = `${position.x}px`;
  panel.style.top = `${position.y}px`;
  panel.hidden = initialState === "closed";

  const header = documentRef.createElement("div");
  header.className = "floating-panel-header modal-header";
  header.title = `Drag ${title}`;

  const titleWrap = documentRef.createElement("div");
  titleWrap.className = "floating-panel-title-wrap";

  const badgeElement = documentRef.createElement("span");
  badgeElement.className = "floating-panel-badge";
  badgeElement.textContent = badge;

  const titleElement = documentRef.createElement("h2");
  titleElement.className = "floating-panel-title";
  titleElement.textContent = title;

  titleWrap.append(badgeElement, titleElement);

  const controls = documentRef.createElement("div");
  controls.className = "floating-panel-controls";

  const minimizeButton = documentRef.createElement("button");
  minimizeButton.className = "floating-panel-minimize modal-minimize-btn";
  minimizeButton.type = "button";
  minimizeButton.title = `Minimize ${title}`;
  minimizeButton.setAttribute("aria-label", `Minimize ${title}`);
  minimizeButton.textContent = "_";

  const closeButton = documentRef.createElement("button");
  closeButton.className = "floating-panel-close modal-close";
  closeButton.type = "button";
  closeButton.title = `Close ${title}`;
  closeButton.setAttribute("aria-label", `Close ${title}`);
  closeButton.textContent = "X";

  controls.append(minimizeButton, closeButton);
  header.append(titleWrap, controls);

  const body = documentRef.createElement("div");
  body.className = "floating-panel-body";

  const resizeHandle = documentRef.createElement("div");
  resizeHandle.className = "floating-panel-resize-handle";
  resizeHandle.setAttribute("role", "separator");
  resizeHandle.setAttribute("aria-label", `Resize ${title}`);

  if (!content.classList.contains("transfer-panel")) {
    content.hidden = false;
  }
  content.classList.add("floating-panel-content");
  body.append(content);
  panel.append(header, body, resizeHandle);
  return panel;
}

function setupFloatingPanels(elements: EditorElements, documentRef: Document): void {
  const root = elements.editorRoot;

  for (const panel of Array.from(root.querySelectorAll<HTMLElement>(".floating-panel"))) {
    const panelId = getFloatingPanelId(panel);
    panel.addEventListener("mousedown", () => bringFloatingPanelToFront(root, panel));
    panel.addEventListener("mousemove", (event) => updateFloatingPanelResizeCursor(panel, event));
    panel.addEventListener("mouseleave", () => clearFloatingPanelResizeCursor(panel));
    panel.addEventListener("mousedown", (event) => {
      if (event.button !== 0) {
        return;
      }

      const resizeInfo = getFloatingPanelResizeInfo(root, panel, event);
      if (!resizeInfo) {
        return;
      }

      startFloatingPanelResize(root, panel, event, documentRef, resizeInfo);
    }, true);
    panel.querySelector<HTMLElement>(".floating-panel-header")?.addEventListener("mousedown", (event) => {
      if (event.target instanceof HTMLElement && event.target.closest("button")) {
        return;
      }

      startFloatingPanelDrag(root, panel, event, documentRef);
    });
    panel.querySelector<HTMLElement>(".floating-panel-resize-handle")?.addEventListener("mousedown", (event) => {
      startFloatingPanelResize(root, panel, event, documentRef, {
        mode: "floating",
        edges: { left: false, right: true, top: false, bottom: true }
      });
    });
    panel.querySelector<HTMLButtonElement>(".floating-panel-minimize")?.addEventListener("click", () => {
      minimizeFloatingPanel(root, panelId, documentRef);
    });
    panel.querySelector<HTMLButtonElement>(".floating-panel-close")?.addEventListener("click", () => {
      closeFloatingPanel(root, panelId);
    });
  }

  for (const button of Array.from(root.querySelectorAll<HTMLButtonElement>("[data-editor-tab-shortcut]"))) {
    button.addEventListener("click", () => {
      showEditorTab(elements, getEditorTabShortcut(button));
    });
  }

  for (const button of Array.from(root.querySelectorAll<HTMLButtonElement>("[data-workspace-mode]"))) {
    button.addEventListener("click", () => {
      const workspace = getWorkspaceMode(button);
      switchEditorWorkspace(elements, workspace, documentRef);
      if (button.dataset.symbolPanelShortcut) {
        showSymbolEditorTab(elements, getSymbolPanelShortcut(button));
      }
    });
  }

  for (const button of Array.from(root.querySelectorAll<HTMLButtonElement>("[data-open-panel]"))) {
    if (button.dataset.editorTabShortcut) {
      continue;
    }

    button.addEventListener("click", () => {
      toggleFloatingPanel(root, getFloatingPanelId(button), documentRef);
    });
  }

  for (const button of Array.from(root.querySelectorAll<HTMLButtonElement>("[data-transfer-mode]"))) {
    button.addEventListener("click", () => {
      openTransferPanel(elements, getTransferMode(button));
    });
  }

  updateFloatingPanelRailState(root);
}

function getEditorTabShortcut(button: HTMLElement): EditorTabName {
  const tab = button.dataset.editorTabShortcut;
  if (tab === "inspector" || tab === "json") {
    return tab;
  }

  return "items";
}

function getWorkspaceMode(button: HTMLElement): WorkspaceMode {
  return button.dataset.workspaceMode === "symbol" ? "symbol" : "card";
}

function getSymbolPanelShortcut(button: HTMLElement): SymbolEditorTabName {
  const tab = button.dataset.symbolPanelShortcut;
  if (tab === "parts" || tab === "slots") {
    return tab;
  }

  return "items";
}

function getTransferMode(button: HTMLElement): TransferPanelMode {
  const mode = button.dataset.transferMode;
  if (mode === "svg" || mode === "export" || mode === "theme") {
    return mode;
  }

  return "import";
}

function getFloatingPanelId(element: HTMLElement): FloatingPanelId {
  const panelId = element.dataset.panelId ?? element.dataset.openPanel;
  if (
    panelId === "items"
    || panelId === "inspector"
    || panelId === "json"
    || panelId === "transfer"
  ) {
    return panelId;
  }

  throw new Error(`Unknown floating panel: ${panelId ?? "missing"}`);
}

function getFloatingPanel(root: ParentNode, panelId: FloatingPanelId): HTMLElement {
  return getRequiredElement(root, `[data-panel-id="${panelId}"]`, HTMLElement);
}

function openFloatingPanel(root: HTMLElement, panelId: FloatingPanelId): void {
  const panel = getFloatingPanel(root, panelId);
  if (panel.dataset.panelState === "docked") {
    panel.hidden = false;
    removeFloatingPanelDockChip(root, panelId);
    updateDockedWorkspaceInsets(root);
    updateFloatingPanelRailState(root);
    queueSnapTourHint(root, panel, root.ownerDocument);
    return;
  }

  undockFloatingPanel(root, panelId);
  panel.dataset.panelState = "open";
  panel.hidden = false;
  removeFloatingPanelDockChip(root, panelId);
  bringFloatingPanelToFront(root, panel);
  updateDockedWorkspaceInsets(root);
  updateFloatingPanelRailState(root);
  queueSnapTourHint(root, panel, root.ownerDocument);
}

function toggleFloatingPanel(root: HTMLElement, panelId: FloatingPanelId, documentRef: Document): void {
  const panel = getFloatingPanel(root, panelId);

  if (panel.hidden || (panel.dataset.panelState !== "open" && panel.dataset.panelState !== "maximized" && panel.dataset.panelState !== "docked")) {
    openFloatingPanel(root, panelId);
    return;
  }

  minimizeFloatingPanel(root, panelId, documentRef);
}

function minimizeFloatingPanel(root: HTMLElement, panelId: FloatingPanelId, documentRef: Document): void {
  const panel = getFloatingPanel(root, panelId);
  if (panel.hidden || panel.dataset.panelState === "closed") {
    return;
  }

  panel.dataset.panelState = "minimized";
  panel.hidden = true;
  ensureFloatingPanelDockChip(root, panelId, documentRef);
  updateDockedWorkspaceInsets(root);
  refreshAllDockZoneStacks(root);
  updateFloatingPanelRailState(root);
}

function closeFloatingPanel(root: HTMLElement, panelId: FloatingPanelId): void {
  const panel = getFloatingPanel(root, panelId);
  panel.dataset.panelState = "closed";
  panel.hidden = true;
  removeFloatingPanelDockChip(root, panelId);
  updateDockedWorkspaceInsets(root);
  refreshAllDockZoneStacks(root);
  updateFloatingPanelRailState(root);
}

function ensureFloatingPanelDockChip(root: HTMLElement, panelId: FloatingPanelId, documentRef: Document): void {
  const dock = getRequiredElement(root, ".floating-panel-dock", HTMLElement);
  if (dock.querySelector(`[data-dock-panel="${panelId}"]`)) {
    return;
  }

  const panel = getFloatingPanel(root, panelId);
  const panelTitle = panel.querySelector<HTMLElement>(".floating-panel-title")?.textContent ?? panelId;
  const chip = documentRef.createElement("button");
  chip.className = "floating-panel-dock-chip";
  chip.type = "button";
  chip.dataset.dockPanel = panelId;
  chip.textContent = panelTitle;
  chip.title = `Restore ${panelTitle}`;
  chip.addEventListener("click", () => openFloatingPanel(root, panelId));
  dock.append(chip);
}

function removeFloatingPanelDockChip(root: ParentNode, panelId: FloatingPanelId): void {
  root.querySelector<HTMLElement>(`[data-dock-panel="${panelId}"]`)?.remove();
}

function bringFloatingPanelToFront(root: HTMLElement, panel: HTMLElement): void {
  if (panel.dataset.panelState === "docked") {
    return;
  }

  const nextZ = Number(root.dataset.floatingPanelZ ?? "10") + 1;
  root.dataset.floatingPanelZ = String(nextZ);
  panel.style.zIndex = String(nextZ);
}

function startFloatingPanelDrag(
  root: HTMLElement,
  panel: HTMLElement,
  event: MouseEvent,
  documentRef: Document
): void {
  event.preventDefault();
  bringFloatingPanelToFront(root, panel);

  const layer = getRequiredElement(root, ".floating-panel-layer", HTMLElement);
  const docked = panel.dataset.panelState === "docked";
  if (panel.dataset.panelState === "maximized") {
    restoreMaximizedPanelForDrag(root, panel, event);
  }
  const panelRect = panel.getBoundingClientRect();
  const layerRect = layer.getBoundingClientRect();
  const state: FloatingPanelDragState = {
    panel,
    layer,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startLeft: panelRect.left - layerRect.left,
    startTop: panelRect.top - layerRect.top,
    moved: false,
    pointerOffsetX: event.clientX - panelRect.left,
    pointerOffsetY: event.clientY - panelRect.top,
    wasDocked: docked
  };

  const onMove = (moveEvent: MouseEvent): void => dragFloatingPanel(root, state, moveEvent);
  const stopDrag = (upEvent: MouseEvent): void => {
    panel.dataset.dragging = "false";
    const snapTarget = getFloatingPanelSnapTarget(root, state.layer, panel, upEvent);
    clearFloatingPanelDockTarget(root);
    hideFloatingPanelTileGhost(root);

    if (snapTarget?.zone === "fullscreen") {
      maximizeFloatingPanel(root, panel);
    } else if (snapTarget?.accepted && (snapTarget.zone === "left" || snapTarget.zone === "right" || snapTarget.zone === "bottom")) {
      dockFloatingPanel(root, panel, snapTarget.zone, upEvent);
    } else if (snapTarget && !snapTarget.accepted && (snapTarget.zone === "left" || snapTarget.zone === "right")) {
      panel.dataset.snapRejected = snapTarget.zone;
      updateFloatingPanelRailState(root);
    } else if (state.wasDocked && state.moved) {
      undockFloatingPanel(root, getFloatingPanelId(panel), upEvent);
    } else {
      updateDockedWorkspaceInsets(root);
    }

    delete panel.dataset.undockPreview;
    documentRef.removeEventListener("mousemove", onMove);
    documentRef.removeEventListener("mouseup", stopDrag);
  };

  panel.dataset.dragging = "true";
  delete panel.dataset.snapRejected;
  if (docked) {
    panel.dataset.undockPreview = "true";
  }
  documentRef.addEventListener("mousemove", onMove);
  documentRef.addEventListener("mouseup", stopDrag);
}

function dragFloatingPanel(root: HTMLElement, state: FloatingPanelDragState, event: MouseEvent): void {
  state.moved = true;
  const snapTarget = getFloatingPanelSnapTarget(root, state.layer, state.panel, event);
  showFloatingPanelTileGhost(root, snapTarget);

  if (state.panel.dataset.panelState === "docked") {
    if (!shouldDetachDockedPanel(state.panel, event)) {
      return;
    }

    detachDockedPanelForDrag(root, state, event);
    delete state.panel.dataset.undockPreview;
    updateDockedWorkspaceInsets(root);
  }

  if (state.panel.dataset.panelState === "docked") {
    return;
  }

  const nextLeft = state.startLeft + event.clientX - state.startClientX;
  const nextTop = state.startTop + event.clientY - state.startClientY;

  state.panel.style.left = `${Math.round(nextLeft)}px`;
  state.panel.style.top = `${Math.round(nextTop)}px`;
  state.panel.style.right = "auto";
  state.panel.style.bottom = "auto";
}

function shouldDetachDockedPanel(panel: HTMLElement, event: MouseEvent): boolean {
  const zone = getFloatingPanelDockZone(panel);
  if (!zone) {
    return false;
  }

  const target = panel.parentElement;
  if (!target) {
    return false;
  }

  const rect = target.getBoundingClientRect();
  switch (zone) {
    case "left":
      return event.clientX > rect.right + FLOATING_PANEL_UNDOCK_PX;
    case "right":
      return event.clientX < rect.left - FLOATING_PANEL_UNDOCK_PX;
    case "bottom":
      return event.clientY < rect.top - FLOATING_PANEL_UNDOCK_PX;
  }
}

function detachDockedPanelForDrag(root: HTMLElement, state: FloatingPanelDragState, event: MouseEvent): void {
  const panel = state.panel;
  const panels = getRequiredElement(root, ".floating-panels", HTMLElement);
  const layerRect = state.layer.getBoundingClientRect();
  const snapshot = getFloatingPanelPreDockSnapshot(panel);
  const renderedRect = panel.getBoundingClientRect();
  const width = snapshot ? getPanelPixelSize(panel, "width", snapshot.width) : renderedRect.width;
  const height = snapshot ? getPanelPixelSize(panel, "height", snapshot.height) : renderedRect.height;
  const nextWidth = Math.max(FLOATING_PANEL_MIN_WIDTH, Math.round(width || renderedRect.width || 420));
  const nextHeight = Math.max(FLOATING_PANEL_MIN_HEIGHT, Math.round(height || renderedRect.height || 320));
  const nextLeft = event.clientX - layerRect.left - Math.min(state.pointerOffsetX, nextWidth - 24);
  const nextTop = event.clientY - layerRect.top - Math.min(state.pointerOffsetY, 36);

  panels.append(panel);
  delete panel.dataset.dockZone;
  panel.dataset.panelState = "open";
  panel.dataset.detaching = "true";
  panel.hidden = false;
  panel.style.left = `${Math.round(nextLeft)}px`;
  panel.style.top = `${Math.round(nextTop)}px`;
  panel.style.right = "auto";
  panel.style.bottom = "auto";
  panel.style.width = `${nextWidth}px`;
  panel.style.height = `${nextHeight}px`;
  panel.style.maxHeight = "none";
  state.startClientX = event.clientX;
  state.startClientY = event.clientY;
  state.startLeft = nextLeft;
  state.startTop = nextTop;
  state.wasDocked = false;
  bringFloatingPanelToFront(root, panel);
  updateDockedWorkspaceInsets(root);
  refreshAllDockZoneStacks(root);
  panel.ownerDocument.defaultView?.setTimeout(() => {
    delete panel.dataset.detaching;
  }, 180);
}

function getFloatingPanelSnapZoneFromPoint(layer: HTMLElement, event: MouseEvent): FloatingPanelSnapZone | undefined {
  const rect = layer.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const width = layer.clientWidth || rect.width || 1;
  const height = layer.clientHeight || rect.height || 1;

  if (y <= ODYSSEUS_FULLSCREEN_SNAP_PX) {
    return "fullscreen";
  }
  if (x <= ODYSSEUS_EDGE_SNAP_PX) {
    return "left";
  }
  if (x >= width - ODYSSEUS_EDGE_SNAP_PX) {
    return "right";
  }
  if (y >= height - ODYSSEUS_BOTTOM_SNAP_PX) {
    return "bottom";
  }

  return undefined;
}

function getFloatingPanelSnapTarget(
  root: HTMLElement,
  layer: HTMLElement,
  panel: HTMLElement,
  event: MouseEvent
): FloatingPanelSnapTarget | undefined {
  const zone = getFloatingPanelSnapZoneFromPoint(layer, event);
  if (!zone) {
    return undefined;
  }

  const { width, height } = getFloatingPanelLayerSize(layer);
  if (zone === "fullscreen") {
    return { accepted: true, rect: { left: 0, top: 0, width, height }, zone };
  }

  if (zone === "bottom") {
    const bottomHeight = getDefaultDockZoneSize(layer, "bottom");
    return {
      accepted: true,
      rect: { left: 0, top: height - bottomHeight, width, height: bottomHeight },
      zone
    };
  }

  const target = getRequiredElement(root, `[data-dock-zone="${zone}"]`, HTMLElement);
  const dockWidth = getDockZoneSize(target, zone);
  const existingPanels = getSideDockPanels(target).filter((candidate) => candidate !== panel);
  const isSameSideReorder = panel.parentElement === target && panel.dataset.panelState === "docked";
  const accepted = existingPanels.length < FLOATING_PANEL_SIDE_STACK_LIMIT || isSameSideReorder;
  const index = getSideDockInsertionIndex(target, panel, event, existingPanels.length);
  const slots = Math.max(1, Math.min(FLOATING_PANEL_SIDE_STACK_LIMIT, existingPanels.length + 1));
  const slotHeight = height / slots;
  const left = zone === "left" ? 0 : width - dockWidth;

  return {
    accepted,
    index,
    rect: {
      left,
      top: Math.round(slotHeight * Math.min(index, slots - 1)),
      width: dockWidth,
      height: Math.round(slotHeight)
    },
    zone
  };
}

function showFloatingPanelTileGhost(root: HTMLElement, target: FloatingPanelSnapTarget | undefined): void {
  const ghost = root.querySelector<HTMLElement>("#tile-ghost");
  if (!ghost || !target) {
    hideFloatingPanelTileGhost(root);
    return;
  }

  ghost.style.left = `${target.rect.left}px`;
  ghost.style.top = `${target.rect.top}px`;
  ghost.style.width = `${target.rect.width}px`;
  ghost.style.height = `${target.rect.height}px`;
  ghost.classList.toggle("blocked", !target.accepted);
  ghost.classList.add("visible");
}

function hideFloatingPanelTileGhost(root: HTMLElement): void {
  const ghost = root.querySelector<HTMLElement>("#tile-ghost");
  ghost?.classList.remove("visible", "blocked");
}

function setFloatingPanelDockTarget(root: HTMLElement, zone: FloatingPanelDockZone | undefined): void {
  for (const target of Array.from(root.querySelectorAll<HTMLElement>("[data-dock-zone]"))) {
    target.dataset.dropTarget = String(target.dataset.dockZone === zone);
  }
}

function clearFloatingPanelDockTarget(root: HTMLElement): void {
  setFloatingPanelDockTarget(root, undefined);
}

function getFloatingPanelLayerSize(layer: HTMLElement): { width: number; height: number } {
  const rect = layer.getBoundingClientRect();
  return {
    width: layer.clientWidth || rect.width || 1,
    height: layer.clientHeight || rect.height || 1
  };
}

function getSideDockPanels(target: HTMLElement): HTMLElement[] {
  return Array.from(target.querySelectorAll<HTMLElement>(".floating-panel"))
    .filter((panel) => !panel.hidden && panel.dataset.panelState === "docked");
}

function getSideDockInsertionIndex(
  target: HTMLElement,
  panel: HTMLElement,
  event: MouseEvent,
  existingCount = getSideDockPanels(target).filter((candidate) => candidate !== panel).length
): number {
  const panels = getSideDockPanels(target).filter((candidate) => candidate !== panel);
  for (let index = 0; index < panels.length; index += 1) {
    const rect = panels[index].getBoundingClientRect();
    if (rect.height > 0 && event.clientY < rect.top + rect.height / 2) {
      return index;
    }
  }

  const rect = target.getBoundingClientRect();
  const zoneHeight = rect.height || target.closest<HTMLElement>(".floating-panel-layer")?.getBoundingClientRect().height || 1;
  const relativeY = clamp(event.clientY - rect.top, 0, zoneHeight);
  const slots = Math.max(1, existingCount + 1);
  return clamp(Math.floor(relativeY / Math.max(1, zoneHeight / slots)), 0, slots - 1);
}

function refreshAllDockZoneStacks(root: HTMLElement): void {
  for (const zone of ["left", "right"] satisfies FloatingPanelDockZone[]) {
    const target = getRequiredElement(root, `[data-dock-zone="${zone}"]`, HTMLElement);
    applySideDockRatios(target);
    renderSideDockDividers(root, target);
  }
}

function applySideDockRatios(target: HTMLElement): void {
  const panels = getSideDockPanels(target);
  if (panels.length === 0) {
    return;
  }

  const ratios = normalizeSideDockRatios(panels.map(getPanelDockRatio));
  panels.forEach((panel, index) => {
    const ratio = ratios[index] ?? 1 / panels.length;
    panel.dataset.dockRatio = ratio.toFixed(4);
    panel.style.flex = `${Math.max(0.01, ratio)} 1 0`;
  });
}

function normalizeSideDockRatios(ratios: number[]): number[] {
  if (ratios.length === 0) {
    return [];
  }

  const fallback = 1 / ratios.length;
  const cleaned = ratios.map((ratio) => Number.isFinite(ratio) && ratio > 0 ? ratio : fallback);
  const total = cleaned.reduce((sum, ratio) => sum + ratio, 0) || 1;
  return cleaned.map((ratio) => ratio / total);
}

function getPanelDockRatio(panel: HTMLElement): number {
  const parsed = Number.parseFloat(panel.dataset.dockRatio ?? "");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Number.NaN;
}

function renderSideDockDividers(root: HTMLElement, target: HTMLElement): void {
  target.querySelectorAll<HTMLElement>(".floating-panel-split-divider").forEach((divider) => divider.remove());
  const panels = getSideDockPanels(target);
  if (panels.length < 2) {
    return;
  }

  panels.slice(0, -1).forEach((panel, index) => {
    const divider = root.ownerDocument.createElement("div");
    divider.className = "floating-panel-split-divider";
    divider.dataset.dividerIndex = String(index);
    divider.dataset.dockZone = target.dataset.dockZone ?? "";
    divider.setAttribute("role", "separator");
    divider.setAttribute("aria-orientation", "horizontal");
    divider.setAttribute("aria-label", "Resize docked panels");
    divider.addEventListener("mousedown", (event) => {
      startSideDockDividerResize(root, target, index, event, root.ownerDocument);
    });
    panel.after(divider);
  });
}

function canDockPanelToSide(target: HTMLElement, panel: HTMLElement): boolean {
  const panels = getSideDockPanels(target).filter((candidate) => candidate !== panel);
  return panels.length < FLOATING_PANEL_SIDE_STACK_LIMIT;
}

function distributeSideDockRatiosAfterInsert(target: HTMLElement, insertedPanel: HTMLElement): void {
  const panels = getSideDockPanels(target);
  if (panels.length === 0) {
    return;
  }

  if (panels.length === 1) {
    insertedPanel.dataset.dockRatio = "1";
    applySideDockRatios(target);
    return;
  }

  const existingPanels = panels.filter((panel) => panel !== insertedPanel);
  const existingRatios = normalizeSideDockRatios(existingPanels.map(getPanelDockRatio));
  const insertedRatio = 1 / panels.length;
  const remainingRatio = 1 - insertedRatio;
  existingPanels.forEach((panel, index) => {
    panel.dataset.dockRatio = ((existingRatios[index] ?? 1 / existingPanels.length) * remainingRatio).toFixed(4);
  });
  insertedPanel.dataset.dockRatio = insertedRatio.toFixed(4);
  applySideDockRatios(target);
}

function startSideDockDividerResize(
  root: HTMLElement,
  target: HTMLElement,
  dividerIndex: number,
  event: MouseEvent,
  documentRef: Document
): void {
  event.preventDefault();
  event.stopPropagation();

  const panels = getSideDockPanels(target);
  const rect = target.getBoundingClientRect();
  const state: SideDockDividerResizeState = {
    target,
    dividerIndex,
    startClientY: event.clientY,
    startRatios: normalizeSideDockRatios(panels.map(getPanelDockRatio)),
    dockHeight: rect.height || target.closest<HTMLElement>(".floating-panel-layer")?.getBoundingClientRect().height || 1
  };
  const onMove = (moveEvent: MouseEvent): void => resizeSideDockDivider(root, state, moveEvent);
  const stopResize = (): void => {
    target.dataset.resizingSplit = "false";
    documentRef.body.classList.remove("window-resizing-active");
    documentRef.body.style.cursor = "";
    documentRef.removeEventListener("mousemove", onMove);
    documentRef.removeEventListener("mouseup", stopResize);
  };

  target.dataset.resizingSplit = "true";
  documentRef.body.classList.add("window-resizing-active");
  documentRef.body.style.cursor = "ns-resize";
  documentRef.addEventListener("mousemove", onMove);
  documentRef.addEventListener("mouseup", stopResize);
}

function resizeSideDockDivider(root: HTMLElement, state: SideDockDividerResizeState, event: MouseEvent): void {
  const panels = getSideDockPanels(state.target);
  if (panels.length < 2 || state.dividerIndex >= panels.length - 1) {
    return;
  }

  const nextRatios = [...state.startRatios];
  const pairTotal = (state.startRatios[state.dividerIndex] ?? 0) + (state.startRatios[state.dividerIndex + 1] ?? 0);
  const minRatio = Math.min(FLOATING_PANEL_SIDE_MIN_RATIO, pairTotal / 2);
  const delta = (event.clientY - state.startClientY) / Math.max(1, state.dockHeight);
  const first = clamp((state.startRatios[state.dividerIndex] ?? pairTotal / 2) + delta, minRatio, pairTotal - minRatio);
  nextRatios[state.dividerIndex] = first;
  nextRatios[state.dividerIndex + 1] = pairTotal - first;

  panels.forEach((panel, index) => {
    const ratio = nextRatios[index] ?? 1 / panels.length;
    panel.dataset.dockRatio = ratio.toFixed(4);
  });
  applySideDockRatios(state.target);
  renderSideDockDividers(root, state.target);
}

type FloatingPanelPreDockSnapshot = {
  width: string;
  height: string;
};

function captureFloatingPanelPreDockSnapshot(panel: HTMLElement): void {
  if (panel.dataset.preDockSnapshot) {
    return;
  }

  const rect = panel.getBoundingClientRect();
  panel.dataset.preDockSnapshot = JSON.stringify({
    width: panel.style.width || `${Math.round(rect.width || panel.offsetWidth || 420)}px`,
    height: panel.style.height || `${Math.round(rect.height || panel.offsetHeight || 320)}px`
  } satisfies FloatingPanelPreDockSnapshot);
}

function getFloatingPanelPreDockSnapshot(panel: HTMLElement): FloatingPanelPreDockSnapshot | undefined {
  const snapshot = panel.dataset.preDockSnapshot;
  if (!snapshot) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(snapshot) as Partial<FloatingPanelPreDockSnapshot>;
    if (typeof parsed.width === "string" && typeof parsed.height === "string") {
      return { width: parsed.width, height: parsed.height };
    }
  } catch {
    // Ignore malformed snapshots from older local state.
  }

  return undefined;
}

function getPanelPixelSize(panel: HTMLElement, dimension: "width" | "height", fallback?: string): number {
  const raw = fallback ?? panel.style[dimension];
  const parsed = raw ? Number.parseFloat(raw) : Number.NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  const rect = panel.getBoundingClientRect();
  return dimension === "width" ? rect.width || panel.offsetWidth : rect.height || panel.offsetHeight;
}

function dockFloatingPanel(root: HTMLElement, panel: HTMLElement, zone: FloatingPanelDockZone, event: MouseEvent): void {
  const target = getRequiredElement(root, `[data-dock-zone="${zone}"]`, HTMLElement);
  const panelId = getFloatingPanelId(panel);
  if ((zone === "left" || zone === "right") && !canDockPanelToSide(target, panel)) {
    panel.dataset.snapRejected = zone;
    updateFloatingPanelRailState(root);
    return;
  }

  captureFloatingPanelPreDockSnapshot(panel);
  if (zone === "left" || zone === "right") {
    target.querySelectorAll<HTMLElement>(".floating-panel-split-divider").forEach((divider) => divider.remove());
  }
  panel.dataset.panelState = "docked";
  panel.dataset.dockZone = zone;
  delete panel.dataset.snapRejected;
  panel.hidden = false;
  panel.style.removeProperty("left");
  panel.style.removeProperty("top");
  panel.style.removeProperty("right");
  panel.style.removeProperty("bottom");
  panel.style.removeProperty("width");
  panel.style.removeProperty("height");
  panel.style.removeProperty("max-height");
  panel.style.removeProperty("z-index");
  removeFloatingPanelDockChip(root, panelId);

  const insertionBefore = getDockInsertionTarget(target, panel, zone, event);
  target.insertBefore(panel, insertionBefore);
  ensureDockZoneSize(root, zone);
  if (zone === "left" || zone === "right") {
    distributeSideDockRatiosAfterInsert(target, panel);
    renderSideDockDividers(root, target);
  }
  updateDockedWorkspaceInsets(root);
  updateFloatingPanelRailState(root);
}

function maximizeFloatingPanel(root: HTMLElement, panel: HTMLElement): void {
  const panelId = getFloatingPanelId(panel);
  const panels = getRequiredElement(root, ".floating-panels", HTMLElement);
  if (panel.parentElement !== panels) {
    panels.append(panel);
  }

  delete panel.dataset.dockZone;
  delete panel.dataset.preDockSnapshot;
  panel.dataset.panelState = "maximized";
  panel.hidden = false;
  panel.style.removeProperty("left");
  panel.style.removeProperty("top");
  panel.style.removeProperty("right");
  panel.style.removeProperty("bottom");
  panel.style.removeProperty("width");
  panel.style.removeProperty("height");
  panel.style.removeProperty("max-height");
  removeFloatingPanelDockChip(root, panelId);
  bringFloatingPanelToFront(root, panel);
  updateDockedWorkspaceInsets(root);
  refreshAllDockZoneStacks(root);
  updateFloatingPanelRailState(root);
}

function restoreMaximizedPanelForDrag(root: HTMLElement, panel: HTMLElement, event: MouseEvent): void {
  const layer = getRequiredElement(root, ".floating-panel-layer", HTMLElement);
  const layerWidth = layer.clientWidth || layer.getBoundingClientRect().width || 1;
  const layerHeight = layer.clientHeight || layer.getBoundingClientRect().height || 1;
  const width = Math.min(860, Math.max(420, Math.round(layerWidth * 0.58)));
  const height = Math.min(640, Math.max(320, Math.round(layerHeight * 0.62)));
  panel.dataset.panelState = "open";
  panel.style.width = `${width}px`;
  panel.style.height = `${height}px`;
  panel.style.maxHeight = "none";
  panel.style.left = `${clamp(event.clientX - width / 2, 0, Math.max(0, layerWidth - width))}px`;
  panel.style.top = `${clamp(event.clientY - 22, 0, Math.max(0, layerHeight - height - FLOATING_PANEL_DOCK_RESERVE))}px`;
  bringFloatingPanelToFront(root, panel);
}

function getDockInsertionTarget(
  target: HTMLElement,
  panel: HTMLElement,
  zone: FloatingPanelDockZone,
  event: MouseEvent
): HTMLElement | null {
  const panels = Array.from(target.querySelectorAll<HTMLElement>(".floating-panel"))
    .filter((candidate) => candidate !== panel);
  const coordinate = zone === "bottom" ? event.clientX : event.clientY;

  for (const candidate of panels) {
    const rect = candidate.getBoundingClientRect();
    const midpoint = zone === "bottom"
      ? rect.left + rect.width / 2
      : rect.top + rect.height / 2;

    if (coordinate < midpoint) {
      return candidate;
    }
  }

  return null;
}

function undockFloatingPanel(root: HTMLElement, panelId: FloatingPanelId, event?: MouseEvent): void {
  const panel = getFloatingPanel(root, panelId);
  const panels = getRequiredElement(root, ".floating-panels", HTMLElement);
  const snapshot = getFloatingPanelPreDockSnapshot(panel);
  if (panel.parentElement !== panels) {
    panels.append(panel);
  }

  delete panel.dataset.dockZone;
  delete panel.dataset.preDockSnapshot;
  if (panel.dataset.panelState === "docked" || panel.dataset.panelState === "maximized") {
    panel.dataset.panelState = "open";
  }
  panel.hidden = false;
  if (snapshot) {
    panel.style.width = snapshot.width;
    panel.style.height = snapshot.height;
    panel.style.maxHeight = "none";
  }
  const width = getPanelPixelSize(panel, "width", snapshot?.width);
  const height = getPanelPixelSize(panel, "height", snapshot?.height);
  panel.style.left = `${Math.max(12, Math.round((event?.clientX ?? 220) - Math.min(width / 2, 160)))}px`;
  panel.style.top = `${Math.max(12, Math.round((event?.clientY ?? 140) - 24))}px`;
  panel.style.right = "auto";
  panel.style.bottom = "auto";
  bringFloatingPanelToFront(root, panel);
  updateDockedWorkspaceInsets(root);
  refreshAllDockZoneStacks(root);
  updateFloatingPanelRailState(root);
}

function startFloatingPanelResize(
  root: HTMLElement,
  panel: HTMLElement,
  event: MouseEvent,
  documentRef: Document,
  resizeInfo: { mode: FloatingPanelResizeMode; edges: FloatingPanelResizeEdges; dockZone?: FloatingPanelDockZone; dockTarget?: HTMLElement }
): void {
  event.preventDefault();
  event.stopPropagation();
  bringFloatingPanelToFront(root, panel);

  const layer = getRequiredElement(root, ".floating-panel-layer", HTMLElement);
  const panelRect = panel.getBoundingClientRect();
  const layerRect = layer.getBoundingClientRect();
  const state: FloatingPanelResizeState = {
    panel,
    layer,
    mode: resizeInfo.mode,
    edges: resizeInfo.edges,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startWidth: resizeInfo.dockTarget
      ? getDockZoneSize(resizeInfo.dockTarget, resizeInfo.dockZone ?? "left")
      : panelRect.width || panel.offsetWidth,
    startHeight: resizeInfo.dockTarget
      ? getDockZoneSize(resizeInfo.dockTarget, resizeInfo.dockZone ?? "bottom")
      : panelRect.height || panel.offsetHeight,
    startLeft: panelRect.left - layerRect.left,
    startTop: panelRect.top - layerRect.top,
    dockZone: resizeInfo.dockZone,
    dockTarget: resizeInfo.dockTarget
  };

  if (state.mode === "floating") {
    panel.style.animation = "none";
    panel.style.left = `${Math.round(state.startLeft)}px`;
    panel.style.top = `${Math.round(state.startTop)}px`;
    panel.style.width = `${Math.round(state.startWidth)}px`;
    panel.style.height = `${Math.round(state.startHeight)}px`;
    panel.style.maxHeight = "none";
  }

  const onMove = (moveEvent: MouseEvent): void => resizeFloatingPanel(root, state, moveEvent);
  const stopResize = (): void => {
    panel.dataset.resizing = "false";
    documentRef.body.classList.remove("window-resizing-active");
    documentRef.body.style.cursor = "";
    clearFloatingPanelResizeCursor(panel);
    documentRef.removeEventListener("mousemove", onMove);
    documentRef.removeEventListener("mouseup", stopResize);
  };

  panel.dataset.resizing = "true";
  documentRef.body.classList.add("window-resizing-active");
  documentRef.body.style.cursor = getFloatingPanelResizeCursor(resizeInfo.edges);
  documentRef.addEventListener("mousemove", onMove);
  documentRef.addEventListener("mouseup", stopResize);
}

function resizeFloatingPanel(root: HTMLElement, state: FloatingPanelResizeState, event: MouseEvent): void {
  if (state.mode === "dock-zone" && state.dockTarget && state.dockZone) {
    resizeDockZone(root, state, event);
    return;
  }

  const layerWidth = state.layer.clientWidth || state.layer.getBoundingClientRect().width || 1;
  const layerHeight = state.layer.clientHeight || state.layer.getBoundingClientRect().height || 1;
  const dx = event.clientX - state.startClientX;
  const dy = event.clientY - state.startClientY;
  let nextLeft = state.startLeft;
  let nextTop = state.startTop;
  let nextWidth = state.startWidth;
  let nextHeight = state.startHeight;

  if (state.edges.right) {
    nextWidth = state.startWidth + dx;
  }
  if (state.edges.bottom) {
    nextHeight = state.startHeight + dy;
  }
  if (state.edges.left) {
    nextWidth = state.startWidth - dx;
    nextLeft = state.startLeft + dx;
  }
  if (state.edges.top) {
    nextHeight = state.startHeight - dy;
    nextTop = state.startTop + dy;
  }

  if (nextWidth < FLOATING_PANEL_MIN_WIDTH) {
    if (state.edges.left) {
      nextLeft = state.startLeft + (state.startWidth - FLOATING_PANEL_MIN_WIDTH);
    }
    nextWidth = FLOATING_PANEL_MIN_WIDTH;
  }
  if (nextHeight < FLOATING_PANEL_MIN_HEIGHT) {
    if (state.edges.top) {
      nextTop = state.startTop + (state.startHeight - FLOATING_PANEL_MIN_HEIGHT);
    }
    nextHeight = FLOATING_PANEL_MIN_HEIGHT;
  }

  if (nextLeft < 0) {
    nextWidth += nextLeft;
    nextLeft = 0;
  }
  if (nextTop < 0) {
    nextHeight += nextTop;
    nextTop = 0;
  }
  if (nextLeft + nextWidth > layerWidth) {
    nextWidth = Math.max(FLOATING_PANEL_MIN_WIDTH, layerWidth - nextLeft);
  }
  if (nextTop + nextHeight > layerHeight - FLOATING_PANEL_DOCK_RESERVE) {
    nextHeight = Math.max(FLOATING_PANEL_MIN_HEIGHT, layerHeight - FLOATING_PANEL_DOCK_RESERVE - nextTop);
  }

  state.panel.style.left = `${Math.round(nextLeft)}px`;
  state.panel.style.top = `${Math.round(nextTop)}px`;
  state.panel.style.width = `${Math.round(nextWidth)}px`;
  state.panel.style.height = `${Math.round(nextHeight)}px`;
  state.panel.style.maxHeight = "none";
}

function resizeDockZone(root: HTMLElement, state: FloatingPanelResizeState, event: MouseEvent): void {
  if (!state.dockTarget || !state.dockZone) {
    return;
  }

  const layerWidth = state.layer.clientWidth || state.layer.getBoundingClientRect().width || 1;
  const layerHeight = state.layer.clientHeight || state.layer.getBoundingClientRect().height || 1;
  if (state.dockZone === "left") {
    const width = clamp(state.startWidth + event.clientX - state.startClientX, FLOATING_PANEL_MIN_WIDTH, Math.max(FLOATING_PANEL_MIN_WIDTH, layerWidth * 0.72));
    setDockZoneSize(root, "left", width);
    return;
  }

  if (state.dockZone === "right") {
    const width = clamp(state.startWidth - (event.clientX - state.startClientX), FLOATING_PANEL_MIN_WIDTH, Math.max(FLOATING_PANEL_MIN_WIDTH, layerWidth * 0.72));
    setDockZoneSize(root, "right", width);
    return;
  }

  const height = clamp(state.startHeight - (event.clientY - state.startClientY), FLOATING_PANEL_MIN_HEIGHT, Math.max(FLOATING_PANEL_MIN_HEIGHT, layerHeight * 0.72));
  setDockZoneSize(root, "bottom", height);
}

function getFloatingPanelResizeInfo(
  root: HTMLElement,
  panel: HTMLElement,
  event: MouseEvent
): { mode: FloatingPanelResizeMode; edges: FloatingPanelResizeEdges; dockZone?: FloatingPanelDockZone; dockTarget?: HTMLElement } | undefined {
  // Edge/corner proximity model adapted from Odysseus static/js/windowResize.js (MIT).
  if (event.target instanceof HTMLElement && event.target.closest("button, input, select, textarea, a, [contenteditable=\"true\"]")) {
    return undefined;
  }

  const dockZone = getFloatingPanelDockZone(panel);
  if (panel.dataset.panelState === "docked" && dockZone && panel.parentElement) {
    const rect = panel.getBoundingClientRect();
    if (dockZone === "left" && Math.abs(event.clientX - rect.right) <= FLOATING_PANEL_RESIZE_EDGE_PX) {
      return { mode: "dock-zone", dockZone, dockTarget: panel.parentElement, edges: { left: false, right: true, top: false, bottom: false } };
    }
    if (dockZone === "right" && Math.abs(event.clientX - rect.left) <= FLOATING_PANEL_RESIZE_EDGE_PX) {
      return { mode: "dock-zone", dockZone, dockTarget: panel.parentElement, edges: { left: true, right: false, top: false, bottom: false } };
    }
    if (dockZone === "bottom" && Math.abs(event.clientY - rect.top) <= FLOATING_PANEL_RESIZE_EDGE_PX) {
      return { mode: "dock-zone", dockZone, dockTarget: panel.parentElement, edges: { left: false, right: false, top: true, bottom: false } };
    }

    return undefined;
  }

  if (panel.dataset.panelState === "closed" || panel.dataset.panelState === "minimized" || panel.hidden) {
    return undefined;
  }

  const rect = panel.getBoundingClientRect();
  const within = event.clientX >= rect.left - FLOATING_PANEL_RESIZE_EDGE_PX
    && event.clientX <= rect.right + FLOATING_PANEL_RESIZE_EDGE_PX
    && event.clientY >= rect.top - FLOATING_PANEL_RESIZE_EDGE_PX
    && event.clientY <= rect.bottom + FLOATING_PANEL_RESIZE_EDGE_PX;
  if (!within) {
    return undefined;
  }

  const edges = {
    left: Math.abs(event.clientX - rect.left) <= FLOATING_PANEL_RESIZE_EDGE_PX,
    right: Math.abs(event.clientX - rect.right) <= FLOATING_PANEL_RESIZE_EDGE_PX,
    top: Math.abs(event.clientY - rect.top) <= FLOATING_PANEL_RESIZE_EDGE_PX,
    bottom: Math.abs(event.clientY - rect.bottom) <= FLOATING_PANEL_RESIZE_EDGE_PX
  };

  if (!edges.left && !edges.right && !edges.top && !edges.bottom) {
    return undefined;
  }

  return { mode: "floating", edges };
}

function updateFloatingPanelResizeCursor(panel: HTMLElement, event: MouseEvent): void {
  if (panel.dataset.resizing === "true" || panel.dataset.dragging === "true") {
    return;
  }

  const root = panel.closest<HTMLElement>(".editor-shell");
  if (!root) {
    return;
  }

  const info = getFloatingPanelResizeInfo(root, panel, event);
  if (!info) {
    clearFloatingPanelResizeCursor(panel);
    return;
  }

  panel.style.cursor = getFloatingPanelResizeCursor(info.edges);
}

function clearFloatingPanelResizeCursor(panel: HTMLElement): void {
  panel.style.cursor = "";
}

function getFloatingPanelResizeCursor(edges: FloatingPanelResizeEdges): string {
  if ((edges.left && edges.top) || (edges.right && edges.bottom)) {
    return "nwse-resize";
  }
  if ((edges.right && edges.top) || (edges.left && edges.bottom)) {
    return "nesw-resize";
  }
  if (edges.left || edges.right) {
    return "ew-resize";
  }
  if (edges.top || edges.bottom) {
    return "ns-resize";
  }

  return "";
}

function ensureDockZoneSize(root: HTMLElement, zone: FloatingPanelDockZone): void {
  const target = getRequiredElement(root, `[data-dock-zone="${zone}"]`, HTMLElement);
  if ((zone === "left" || zone === "right") && !target.style.width) {
    setDockZoneSize(root, zone, getDefaultDockZoneSize(target, zone));
  }
  if (zone === "bottom" && !target.style.height) {
    setDockZoneSize(root, zone, getDefaultDockZoneSize(target, zone));
  }
}

function getDefaultDockZoneSize(element: HTMLElement, zone: FloatingPanelDockZone): number {
  const rect = element.closest<HTMLElement>(".floating-panel-layer")?.getBoundingClientRect() ?? element.getBoundingClientRect();
  const width = element.closest<HTMLElement>(".floating-panel-layer")?.clientWidth || rect.width || 1;
  const height = element.closest<HTMLElement>(".floating-panel-layer")?.clientHeight || rect.height || 1;
  if (zone === "bottom") {
    return Math.max(180, Math.min(320, Math.round(height * 0.28)));
  }

  return Math.max(340, Math.min(620, Math.round(width * 0.38)));
}

function getDockZoneSize(target: HTMLElement, zone: FloatingPanelDockZone): number {
  const propertyValue = zone === "bottom" ? target.style.height : target.style.width;
  const parsed = Number.parseFloat(propertyValue);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  const rect = target.getBoundingClientRect();
  const measured = zone === "bottom" ? rect.height : rect.width;
  return measured || getDefaultDockZoneSize(target, zone);
}

function setDockZoneSize(root: HTMLElement, zone: FloatingPanelDockZone, size: number): void {
  const target = getRequiredElement(root, `[data-dock-zone="${zone}"]`, HTMLElement);
  if (zone === "bottom") {
    target.style.height = `${Math.round(size)}px`;
  } else {
    target.style.width = `${Math.round(size)}px`;
  }
  updateDockedWorkspaceInsets(root);
}

function updateDockedWorkspaceInsets(root: HTMLElement): void {
  const left = getActiveDockZoneInset(root, "left");
  const right = getActiveDockZoneInset(root, "right");
  const bottom = getActiveDockZoneInset(root, "bottom");

  setWorkspaceInset(root, "left", left);
  setWorkspaceInset(root, "right", right);
  setWorkspaceInset(root, "bottom", bottom);
}

function getActiveDockZoneInset(root: HTMLElement, zone: FloatingPanelDockZone): number {
  const target = root.querySelector<HTMLElement>(`[data-dock-zone="${zone}"]`);
  if (!target) {
    return 0;
  }

  const hasActivePanel = Array.from(target.querySelectorAll<HTMLElement>(".floating-panel")).some((panel) => (
    !panel.hidden && panel.dataset.panelState === "docked"
  ));
  if (!hasActivePanel) {
    return 0;
  }

  return getDockZoneSize(target, zone);
}

function setWorkspaceInset(root: HTMLElement, side: "left" | "right" | "bottom", value: number): void {
  const property = `--workspace-${side}-dock-${side === "bottom" ? "h" : "w"}`;
  if (value > 0) {
    root.style.setProperty(property, `${Math.round(value)}px`);
    return;
  }

  root.style.removeProperty(property);
}

function updateFloatingPanelRailState(root: HTMLElement): void {
  for (const button of Array.from(root.querySelectorAll<HTMLButtonElement>("[data-open-panel]"))) {
    const panelId = getFloatingPanelId(button);
    const panel = getFloatingPanel(root, panelId);
    button.setAttribute("aria-pressed", String(!panel.hidden && panel.dataset.panelState !== "closed"));
  }
}

function switchEditorWorkspace(elements: EditorElements, workspace: WorkspaceMode, documentRef: Document): void {
  const previousWorkspace = elements.activeWorkspace;
  if (previousWorkspace !== workspace) {
    elements.workspacePanelLayouts[previousWorkspace] = captureFloatingPanelLayout(elements.editorRoot);
  }

  elements.activeWorkspace = workspace;
  elements.editorRoot.dataset.workspace = workspace;
  elements.cardWorkspace.hidden = workspace !== "card";

  if (workspace === "symbol") {
    ensureSymbolWorkspaceOpen(elements, documentRef);
  } else {
    elements.symbolWorkspace.hidden = true;
    closeSymbolImportDialog(elements);
  }

  if (previousWorkspace !== workspace) {
    restoreFloatingPanelLayout(
      elements.editorRoot,
      elements.workspacePanelLayouts[workspace],
      documentRef
    );
  }

  updateWorkspaceNavigationState(elements);
}

function updateWorkspaceNavigationState(elements: EditorElements): void {
  elements.editorRoot.dataset.workspace = elements.activeWorkspace;

  for (const button of Array.from(elements.editorRoot.querySelectorAll<HTMLButtonElement>("[data-workspace-mode]"))) {
    button.setAttribute("aria-pressed", String(getWorkspaceMode(button) === elements.activeWorkspace));
  }

  for (const element of Array.from(elements.editorRoot.querySelectorAll<HTMLElement>(".card-tool"))) {
    element.hidden = elements.activeWorkspace !== "card";
  }

  for (const element of Array.from(elements.editorRoot.querySelectorAll<HTMLElement>(".symbol-tool"))) {
    element.hidden = elements.activeWorkspace !== "symbol";
  }

  updateFloatingPanelRailState(elements.editorRoot);
}

function captureFloatingPanelLayout(root: HTMLElement): Partial<Record<FloatingPanelId, FloatingPanelLayoutSnapshot>> {
  const layout: Partial<Record<FloatingPanelId, FloatingPanelLayoutSnapshot>> = {};

  for (const panelId of FLOATING_PANEL_IDS) {
    const panel = getFloatingPanel(root, panelId);
    layout[panelId] = captureFloatingPanelSnapshot(panel);
  }

  return layout;
}

function createClosedFloatingPanelLayout(root: HTMLElement): Partial<Record<FloatingPanelId, FloatingPanelLayoutSnapshot>> {
  const layout = captureFloatingPanelLayout(root);

  for (const panelId of FLOATING_PANEL_IDS) {
    const snapshot = layout[panelId];
    if (!snapshot) {
      continue;
    }

    delete snapshot.dockZone;
    delete snapshot.dockRatio;
    snapshot.hidden = true;
    snapshot.panelState = "closed";
  }

  return layout;
}

function restoreFloatingPanelLayout(
  root: HTMLElement,
  layout: Partial<Record<FloatingPanelId, FloatingPanelLayoutSnapshot>>,
  documentRef: Document
): void {
  const floatingHost = getRequiredElement(root, ".floating-panels", HTMLElement);
  const dock = getRequiredElement(root, ".floating-panel-dock", HTMLElement);
  dock.replaceChildren();

  const targetEntries = new Map<HTMLElement, Array<{ panel: HTMLElement; snapshot: FloatingPanelLayoutSnapshot }>>();
  targetEntries.set(floatingHost, []);

  const dockZones: FloatingPanelDockZone[] = ["left", "right", "bottom"];
  for (const zone of dockZones) {
    const target = getRequiredElement(root, `[data-dock-zone="${zone}"]`, HTMLElement);
    target.querySelectorAll<HTMLElement>(".floating-panel-split-divider").forEach((divider) => divider.remove());
    targetEntries.set(target, []);
  }

  for (const panelId of FLOATING_PANEL_IDS) {
    const panel = getFloatingPanel(root, panelId);
    const snapshot = layout[panelId] ?? captureFloatingPanelSnapshot(panel);
    const target = snapshot.panelState === "docked" && snapshot.dockZone
      ? getRequiredElement(root, `[data-dock-zone="${snapshot.dockZone}"]`, HTMLElement)
      : floatingHost;

    targetEntries.get(target)?.push({ panel, snapshot });
  }

  for (const [target, entries] of targetEntries) {
    entries
      .sort((a, b) => a.snapshot.order - b.snapshot.order)
      .forEach(({ panel }) => target.append(panel));
  }

  restoreDockZoneSizes(root, layout);

  for (const panelId of FLOATING_PANEL_IDS) {
    const panel = getFloatingPanel(root, panelId);
    const snapshot = layout[panelId] ?? captureFloatingPanelSnapshot(panel);
    applyFloatingPanelSnapshot(panel, snapshot);

    if (snapshot.panelState === "minimized") {
      ensureFloatingPanelDockChip(root, panelId, documentRef);
    } else {
      removeFloatingPanelDockChip(root, panelId);
    }
  }

  clearFloatingPanelDockTarget(root);
  hideFloatingPanelTileGhost(root);
  updateDockedWorkspaceInsets(root);
  refreshAllDockZoneStacks(root);
  updateFloatingPanelRailState(root);
}

function captureFloatingPanelSnapshot(panel: HTMLElement): FloatingPanelLayoutSnapshot {
  return {
    dockRatio: getFloatingPanelDockSnapshotRatio(panel),
    dockZone: getFloatingPanelDockZone(panel),
    dockSize: getFloatingPanelDockSnapshotSize(panel),
    hidden: panel.hidden === true,
    order: getFloatingPanelOrder(panel),
    panelState: panel.dataset.panelState ?? "closed",
    style: {
      left: panel.style.left,
      top: panel.style.top,
      right: panel.style.right,
      bottom: panel.style.bottom,
      width: panel.style.width,
      height: panel.style.height,
      maxHeight: panel.style.maxHeight,
      zIndex: panel.style.zIndex
    }
  };
}

function getFloatingPanelDockSnapshotSize(panel: HTMLElement): number | undefined {
  const dockZone = getFloatingPanelDockZone(panel);
  if (!dockZone || panel.dataset.panelState !== "docked" || !panel.parentElement) {
    return undefined;
  }

  return getDockZoneSize(panel.parentElement, dockZone);
}

function getFloatingPanelDockSnapshotRatio(panel: HTMLElement): number | undefined {
  const dockZone = getFloatingPanelDockZone(panel);
  if ((dockZone !== "left" && dockZone !== "right") || panel.dataset.panelState !== "docked") {
    return undefined;
  }

  const ratio = getPanelDockRatio(panel);
  return Number.isFinite(ratio) && ratio > 0 ? ratio : undefined;
}

function restoreDockZoneSizes(
  root: HTMLElement,
  layout: Partial<Record<FloatingPanelId, FloatingPanelLayoutSnapshot>>
): void {
  const dockZones: FloatingPanelDockZone[] = ["left", "right", "bottom"];
  for (const zone of dockZones) {
    const size = FLOATING_PANEL_IDS
      .map((panelId) => layout[panelId])
      .find((snapshot) => snapshot?.dockZone === zone && snapshot.panelState === "docked" && snapshot.dockSize)
      ?.dockSize;
    const target = getRequiredElement(root, `[data-dock-zone="${zone}"]`, HTMLElement);

    if (size) {
      if (zone === "bottom") {
        target.style.height = `${Math.round(size)}px`;
      } else {
        target.style.width = `${Math.round(size)}px`;
      }
      continue;
    }

    if (zone === "bottom") {
      target.style.removeProperty("height");
    } else {
      target.style.removeProperty("width");
    }
  }
}

function getFloatingPanelDockZone(panel: HTMLElement): FloatingPanelDockZone | undefined {
  const dockZone = panel.dataset.dockZone;
  if (dockZone === "left" || dockZone === "right" || dockZone === "bottom") {
    return dockZone;
  }

  return undefined;
}

function getFloatingPanelOrder(panel: HTMLElement): number {
  return Array.from(panel.parentElement?.querySelectorAll<HTMLElement>(".floating-panel") ?? []).indexOf(panel);
}

function applyFloatingPanelSnapshot(panel: HTMLElement, snapshot: FloatingPanelLayoutSnapshot): void {
  if (snapshot.dockZone && snapshot.panelState === "docked") {
    panel.dataset.dockZone = snapshot.dockZone;
  } else {
    delete panel.dataset.dockZone;
  }
  if (snapshot.dockRatio && snapshot.panelState === "docked") {
    panel.dataset.dockRatio = String(snapshot.dockRatio);
  } else {
    delete panel.dataset.dockRatio;
  }

  panel.dataset.panelState = snapshot.panelState;
  panel.hidden = snapshot.hidden || snapshot.panelState === "closed" || snapshot.panelState === "minimized";
  applyFloatingPanelStyleSnapshot(panel, snapshot.style);
}

function applyFloatingPanelStyleSnapshot(panel: HTMLElement, style: FloatingPanelStyleSnapshot): void {
  setInlineStyleValue(panel, "left", style.left);
  setInlineStyleValue(panel, "top", style.top);
  setInlineStyleValue(panel, "right", style.right);
  setInlineStyleValue(panel, "bottom", style.bottom);
  setInlineStyleValue(panel, "width", style.width);
  setInlineStyleValue(panel, "height", style.height);
  setInlineStyleValue(panel, "max-height", style.maxHeight);
  panel.style.zIndex = style.zIndex;
}

function setInlineStyleValue(element: HTMLElement, property: string, value: string): void {
  if (value) {
    element.style.setProperty(property, value);
    return;
  }

  element.style.removeProperty(property);
}

function queueSnapTourHint(root: HTMLElement, panel: HTMLElement, documentRef: Document): void {
  const view = documentRef.defaultView;
  if (!view || root.dataset.snapTourHintQueued === "true" || hasSeenSnapTourHint(root)) {
    return;
  }

  if (view.innerWidth <= 768 || documentRef.body.classList.contains("tour-active")) {
    return;
  }

  root.dataset.snapTourHintQueued = "true";
  view.setTimeout(() => showSnapTourHint(root, panel, documentRef), 380);
}

function hasSeenSnapTourHint(root: HTMLElement): boolean {
  try {
    return root.ownerDocument.defaultView?.localStorage.getItem(SNAP_TOUR_HINT_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

function markSnapTourHintSeen(root: HTMLElement): void {
  try {
    root.ownerDocument.defaultView?.localStorage.setItem(SNAP_TOUR_HINT_STORAGE_KEY, "1");
  } catch {
    // localStorage can be unavailable in embedded or test environments.
  }
}

// Adapted from Odysseus static/js/tourHints.js (MIT); see THIRD_PARTY_NOTICES.md.
function showSnapTourHint(root: HTMLElement, panel: HTMLElement, documentRef: Document): void {
  const view = documentRef.defaultView;
  if (!view || hasSeenSnapTourHint(root) || panel.hidden || !panel.isConnected) {
    return;
  }

  const rect = panel.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return;
  }

  const hint = documentRef.createElement("div");
  hint.className = "tour-hint";
  hint.innerHTML = `
    <div class="tour-hint-visual" aria-hidden="true">
      <svg viewBox="0 0 100 60" width="160" height="96">
        <rect x="0.5" y="0.5" width="99" height="59" rx="3" fill="none" stroke="currentColor" stroke-opacity="0.18" />
        <rect class="th-zone" x="51" y="2" width="47" height="56" rx="2" fill="currentColor" opacity="0" />
        <g class="th-modal-group">
          <rect x="22" y="20" width="34" height="22" rx="2.5" fill="var(--bg)" stroke="currentColor" stroke-width="1.2" />
          <rect x="22" y="20" width="34" height="5" rx="2.5" fill="currentColor" opacity="0.35" />
        </g>
        <path class="th-cursor" d="M0 0 L0 9 L2.5 7 L4.5 10 L6 9 L4 6 L7 6 Z" fill="currentColor" />
      </svg>
    </div>
    <div class="tour-hint-text"><b>Pro tip:</b> drag any window's title bar to a screen edge to snap it. Drag to the top for fullscreen.</div>
    <button class="tour-hint-dismiss" type="button">Got it</button>
  `;
  documentRef.body.append(hint);

  hint.style.opacity = "0";
  view.requestAnimationFrame(() => {
    const hintWidth = hint.offsetWidth || 260;
    const hintHeight = hint.offsetHeight || 200;
    let left = rect.right + 14;
    let top = rect.top;

    if (left + hintWidth > view.innerWidth - 8) {
      left = rect.left - hintWidth - 14;
      if (left < 8) {
        left = Math.max(8, rect.left + (rect.width - hintWidth) / 2);
        top = rect.bottom + 14;
        if (top + hintHeight > view.innerHeight - 8) {
          top = Math.max(8, rect.top - hintHeight - 14);
        }
      }
    }

    hint.style.left = `${left}px`;
    hint.style.top = `${top}px`;
    hint.style.opacity = "";
    hint.classList.add("tour-hint-in");
  });

  const dismiss = (): void => {
    hint.classList.add("tour-hint-out");
    view.setTimeout(() => hint.remove(), 280);
    markSnapTourHintSeen(root);
  };

  hint.querySelector<HTMLButtonElement>(".tour-hint-dismiss")?.addEventListener("click", dismiss);
  view.setTimeout(() => {
    if (hint.isConnected) {
      dismiss();
    }
  }, 14_000);
}

function createPreviewPane(documentRef: Document): HTMLElement {
  const pane = createPane(documentRef, "");
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

  const svgImportSection = documentRef.createElement("section");
  svgImportSection.className = "svg-import-section";
  svgImportSection.hidden = true;

  const svgImportLabel = documentRef.createElement("label");
  svgImportLabel.className = "field-label";
  svgImportLabel.textContent = "Import safe SVG primitives";

  const svgImportInput = documentRef.createElement("textarea");
  svgImportInput.className = "svg-import-input";
  svgImportInput.placeholder = "Paste simple SVG markup with rect, circle, line, polyline, polygon, path, or text";
  svgImportInput.spellcheck = false;
  svgImportInput.wrap = "soft";

  const svgImportButton = documentRef.createElement("button");
  svgImportButton.className = "import-svg-button utility-button";
  svgImportButton.type = "button";
  svgImportButton.textContent = "Import SVG";

  const svgImportHelp = documentRef.createElement("p");
  svgImportHelp.className = "field-helper";
  svgImportHelp.textContent = "Unsafe SVG content is rejected. Supported elements are converted to schema JSON items.";

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

  const themePreviewLabel = documentRef.createElement("label");
  themePreviewLabel.className = "theme-preview-toggle-field";

  const themePreviewToggle = documentRef.createElement("input");
  themePreviewToggle.className = "theme-preview-toggle";
  themePreviewToggle.type = "checkbox";

  const themePreviewText = documentRef.createElement("span");
  themePreviewText.textContent = "Use Imported Theme";

  themePreviewLabel.append(themePreviewToggle, themePreviewText);

  const themeStatus = documentRef.createElement("span");
  themeStatus.className = "theme-status";
  themeStatus.textContent = "Optional theme preview";

  themeControls.append(applyThemeButton, themePreviewLabel, themeStatus);
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
  svgImportSection.append(svgImportLabel, svgImportInput, svgImportButton, svgImportHelp);
  exportHeader.append(exportLabel, copyButton);
  exportSection.append(exportHeader, payloadOutput);
  panel.append(header, statusRow, importSection, svgImportSection, themeSection, exportSection);
  wrapper.append(panel);
  return wrapper;
}

function createPreviewSurface(documentRef: Document): HTMLElement {
  const previewSurface = documentRef.createElement("div");
  previewSurface.className = "preview-surface";
  return previewSurface;
}

function createSymbolTabButton(
  documentRef: Document,
  tab: SymbolEditorTabName,
  label: string,
  className: string
): HTMLButtonElement {
  const button = documentRef.createElement("button");
  button.className = `editor-tab ${className}`;
  button.type = "button";
  button.dataset.symbolTab = tab;
  button.setAttribute("role", "tab");
  button.textContent = label;
  return button;
}

function createSymbolEditorWorkspace(documentRef: Document): HTMLElement {
  const wrapper = documentRef.createElement("section");
  wrapper.className = "symbol-editor-workspace";
  wrapper.hidden = true;

  const startDialog = documentRef.createElement("section");
  startDialog.className = "symbol-start-dialog";
  startDialog.hidden = true;

  const startTitle = documentRef.createElement("h2");
  startTitle.className = "symbol-start-title";
  startTitle.textContent = "Start Symbol Editor";

  const startText = documentRef.createElement("p");
  startText.className = "field-helper";
  startText.textContent = "Choose whether to import a fresh SVG into a symbol or inspect the existing symbol definitions.";

  const startActions = documentRef.createElement("div");
  startActions.className = "symbol-start-actions";

  const startImportButton = documentRef.createElement("button");
  startImportButton.className = "symbol-start-import-button utility-button";
  startImportButton.type = "button";
  startImportButton.textContent = "Import SVG";

  const startEditButton = documentRef.createElement("button");
  startEditButton.className = "symbol-start-edit-button utility-button";
  startEditButton.type = "button";
  startEditButton.textContent = "Edit existing symbol";

  startActions.append(startImportButton, startEditButton);
  startDialog.append(startTitle, startText, startActions);

  const header = documentRef.createElement("header");
  header.className = "symbol-editor-header";

  const title = documentRef.createElement("div");
  title.className = "symbol-editor-title";
  title.textContent = "Symbol Editor";

  const menuBar = documentRef.createElement("div");
  menuBar.className = "symbol-editor-menubar";

  const symbolPanelMenuButton = documentRef.createElement("button");
  symbolPanelMenuButton.className = "symbol-panel-menu-button utility-button";
  symbolPanelMenuButton.type = "button";
  symbolPanelMenuButton.title = "Toggle symbol panels";
  symbolPanelMenuButton.setAttribute("aria-label", "Toggle symbol panels");
  symbolPanelMenuButton.setAttribute("aria-expanded", "false");
  symbolPanelMenuButton.textContent = "☰";

  const symbolPanelMenu = documentRef.createElement("div");
  symbolPanelMenu.className = "symbol-panel-menu";
  symbolPanelMenu.hidden = true;

  const symbolMenuEntries: Array<[string, SymbolEditorTabName]> = [
    ["Items", "items"],
    ["Parts", "parts"],
    ["Slots", "slots"]
  ];

  for (const [label, tab] of symbolMenuEntries) {
    const button = documentRef.createElement("button");
    button.className = "symbol-panel-menu-entry";
    button.type = "button";
    button.dataset.symbolPanelShortcut = tab;
    button.textContent = label;
    button.addEventListener("click", () => {
      symbolPanelMenu.hidden = true;
      symbolPanelMenuButton.setAttribute("aria-expanded", "false");
    });
    symbolPanelMenu.append(button);
  }

  symbolPanelMenuButton.addEventListener("click", () => {
    symbolPanelMenu.hidden = !symbolPanelMenu.hidden;
    symbolPanelMenuButton.setAttribute("aria-expanded", String(!symbolPanelMenu.hidden));
  });

  const fileMenuWrapper = documentRef.createElement("div");
  fileMenuWrapper.className = "symbol-file-menu-wrapper";

  const fileMenuButton = documentRef.createElement("button");
  fileMenuButton.className = "symbol-file-menu-button utility-button";
  fileMenuButton.type = "button";
  fileMenuButton.textContent = "File";
  fileMenuButton.setAttribute("aria-expanded", "false");

  const fileMenu = documentRef.createElement("div");
  fileMenu.className = "symbol-file-menu";
  fileMenu.hidden = true;

  const importSvgMenuButton = documentRef.createElement("button");
  importSvgMenuButton.className = "open-symbol-svg-import-dialog-button";
  importSvgMenuButton.type = "button";
  importSvgMenuButton.textContent = "Import SVG";
  importSvgMenuButton.addEventListener("click", () => {
    fileMenu.hidden = true;
    fileMenuButton.setAttribute("aria-expanded", "false");
    openSymbolImportDialog(wrapper);
  });

  fileMenu.append(importSvgMenuButton);
  fileMenuWrapper.append(fileMenuButton, fileMenu);
  menuBar.append(symbolPanelMenuButton, symbolPanelMenu, fileMenuWrapper);

  const controls = documentRef.createElement("div");
  controls.className = "symbol-editor-controls";

  const symbolSelect = documentRef.createElement("select");
  symbolSelect.className = "symbol-select";
  symbolSelect.setAttribute("aria-label", "Symbol");

  const createButton = documentRef.createElement("button");
  createButton.className = "create-symbol-button utility-button";
  createButton.type = "button";
  createButton.textContent = "Create Symbol";

  const closeButton = documentRef.createElement("button");
  closeButton.className = "close-symbol-workspace-button utility-button";
  closeButton.type = "button";
  closeButton.textContent = "X";
  closeButton.setAttribute("aria-label", "Close symbol editor");

  controls.append(symbolSelect, createButton, closeButton);
  header.append(menuBar, title, controls);

  const body = documentRef.createElement("div");
  body.className = "symbol-editor-body";

  const side = documentRef.createElement("aside");
  side.className = "symbol-editor-side";

  const symbolTabs = documentRef.createElement("div");
  symbolTabs.className = "editor-tabs symbol-tabs";

  const symbolItemsTab = createSymbolTabButton(documentRef, "items", "Items", "symbol-items-tab-button");
  const symbolPartsTab = createSymbolTabButton(documentRef, "parts", "Parts", "symbol-parts-tab-button");
  const symbolSlotsTab = createSymbolTabButton(documentRef, "slots", "Entity Slots", "symbol-slots-tab-button");
  symbolTabs.append(symbolItemsTab, symbolPartsTab, symbolSlotsTab);

  const symbolPrimaryPanel = documentRef.createElement("div");
  symbolPrimaryPanel.className = "editor-primary-panel symbol-primary-panel";

  const symbolTabDropZone = documentRef.createElement("div");
  symbolTabDropZone.className = "editor-tab-drop-zone symbol-tab-drop-zone";
  symbolTabDropZone.textContent = "Drop tab here to split";

  const symbolDockedPanel = documentRef.createElement("div");
  symbolDockedPanel.className = "editor-docked-panel symbol-docked-panel";
  symbolDockedPanel.hidden = true;

  const symbolDockedPanelTab = documentRef.createElement("button");
  symbolDockedPanelTab.className = "editor-tab editor-docked-panel-tab symbol-docked-panel-tab";
  symbolDockedPanelTab.type = "button";
  symbolDockedPanelTab.hidden = true;

  const itemsSection = createSymbolWorkspaceSection(documentRef, "Internal Items", "symbol-internal-item-list");
  itemsSection.classList.add("symbol-items-section");
  const partsSection = createSymbolWorkspaceSection(documentRef, "Parts", "symbol-parts-list");
  partsSection.classList.add("symbol-parts-section");
  const slotsSection = createSymbolWorkspaceSection(documentRef, "Entity Slots", "symbol-slots-list");
  slotsSection.classList.add("symbol-slots-section");
  symbolPrimaryPanel.append(itemsSection, partsSection, slotsSection);
  symbolDockedPanel.append(symbolDockedPanelTab);
  side.append(symbolTabs, symbolPrimaryPanel, symbolTabDropZone, symbolDockedPanel);

  const preview = documentRef.createElement("section");
  preview.className = "symbol-editor-preview-pane";
  const previewHeader = documentRef.createElement("div");
  previewHeader.className = "symbol-preview-header";
  const previewTitle = documentRef.createElement("div");
  previewTitle.className = "field-label";
  previewTitle.textContent = "Symbol Preview";
  const previewControls = documentRef.createElement("div");
  previewControls.className = "symbol-preview-controls";
  const symbolSelectButton = createToolbarButton(documentRef, "symbol-select-tool-button", "Select symbol items", "↖");
  symbolSelectButton.title = "Select";
  symbolSelectButton.setAttribute("aria-label", "Select symbol items");
  symbolSelectButton.setAttribute("aria-pressed", "true");
  const symbolPanButton = createToolbarButton(documentRef, "symbol-pan-tool-button", "Pan symbol preview", "✥");
  symbolPanButton.title = "Pan";
  symbolPanButton.setAttribute("aria-label", "Pan symbol preview");
  symbolPanButton.setAttribute("aria-pressed", "false");
  const symbolResetButton = createToolbarButton(documentRef, "symbol-reset-view-button", "Fit symbol preview", "⛶");
  symbolResetButton.title = "Fit symbol preview";
  const symbolClearButton = createToolbarButton(documentRef, "symbol-clear-selection-button", "Clear symbol item selection", "◌");
  symbolClearButton.title = "Clear symbol item selection";
  const symbolDeleteButton = createToolbarButton(documentRef, "symbol-delete-item-button", "Delete selected symbol item", "×");
  symbolDeleteButton.title = "Delete selected symbol item";
  symbolDeleteButton.disabled = true;
  const symbolUndoButton = createToolbarButton(documentRef, "symbol-undo-button", "Undo", "↶");
  symbolUndoButton.title = "Undo";
  symbolUndoButton.disabled = true;
  const symbolRedoButton = createToolbarButton(documentRef, "symbol-redo-button", "Redo", "↷");
  symbolRedoButton.title = "Redo";
  symbolRedoButton.disabled = true;
  previewControls.append(
    symbolSelectButton,
    symbolPanButton,
    symbolResetButton,
    symbolClearButton,
    symbolDeleteButton,
    symbolUndoButton,
    symbolRedoButton
  );
  previewHeader.append(previewTitle, previewControls);
  const previewSurface = documentRef.createElement("div");
  previewSurface.className = "symbol-preview-surface";
  preview.append(previewHeader, previewSurface);

  const inspectorPane = documentRef.createElement("aside");
  inspectorPane.className = "symbol-editor-inspector-pane";
  const inspectorTitle = documentRef.createElement("div");
  inspectorTitle.className = "field-label";
  inspectorTitle.textContent = "Inspector";
  const inspector = documentRef.createElement("div");
  inspector.className = "symbol-editor-inspector";

  const importDialog = documentRef.createElement("section");
  importDialog.className = "symbol-import-dialog";
  importDialog.hidden = true;

  const importHeader = documentRef.createElement("div");
  importHeader.className = "symbol-import-dialog-header";

  const importTitle = documentRef.createElement("h2");
  importTitle.className = "symbol-import-dialog-title";
  importTitle.textContent = "Import SVG Into Symbol";

  const closeImportDialogButton = documentRef.createElement("button");
  closeImportDialogButton.className = "close-symbol-import-dialog-button utility-button";
  closeImportDialogButton.type = "button";
  closeImportDialogButton.textContent = "X";
  closeImportDialogButton.setAttribute("aria-label", "Close SVG import dialog");

  importHeader.append(importTitle, closeImportDialogButton);

  const importBody = documentRef.createElement("div");
  importBody.className = "symbol-import-dialog-body";

  const dropZone = documentRef.createElement("label");
  dropZone.className = "symbol-svg-drop-zone";
  dropZone.textContent = "Choose or drop a .svg file";

  const fileInput = documentRef.createElement("input");
  fileInput.className = "symbol-svg-file-input";
  fileInput.type = "file";
  fileInput.accept = ".svg,image/svg+xml";
  dropZone.append(fileInput);

  const importInput = documentRef.createElement("textarea");
  importInput.className = "symbol-svg-import-input";
  importInput.placeholder = "Paste simple safe SVG markup";
  importInput.spellcheck = false;
  importInput.wrap = "soft";

  const importButton = documentRef.createElement("button");
  importButton.className = "symbol-svg-import-button utility-button";
  importButton.type = "button";
  importButton.textContent = "Import SVG";

  const cancelButton = documentRef.createElement("button");
  cancelButton.className = "cancel-symbol-import-button utility-button";
  cancelButton.type = "button";
  cancelButton.textContent = "Cancel";

  const importActions = documentRef.createElement("div");
  importActions.className = "symbol-import-dialog-actions";

  const workspaceStatus = documentRef.createElement("div");
  workspaceStatus.className = "symbol-workspace-status";
  workspaceStatus.textContent = "Ready";

  importActions.append(importButton, cancelButton);
  importBody.append(dropZone, importInput, importActions, workspaceStatus);
  importDialog.append(importHeader, importBody);
  inspectorPane.append(inspectorTitle, inspector);

  body.append(side, preview, inspectorPane);
  wrapper.append(header, body, importDialog, startDialog);
  return wrapper;
}

function createSymbolWorkspaceSection(documentRef: Document, title: string, listClassName: string): HTMLElement {
  const section = documentRef.createElement("section");
  section.className = "symbol-workspace-section";

  const heading = documentRef.createElement("div");
  heading.className = "field-label";
  heading.textContent = title;

  const list = documentRef.createElement("div");
  list.className = listClassName;

  section.append(heading, list);
  return section;
}

function createPane(documentRef: Document, title: string): HTMLElement {
  const pane = documentRef.createElement("section");
  pane.className = "pane";

  const header = documentRef.createElement("div");
  header.className = "pane-header";

  if (title) {
    const heading = documentRef.createElement("h1");
    heading.className = "pane-title";
    heading.textContent = title;
    header.append(heading);
  }
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
