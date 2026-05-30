import { decodePayload, encodePayload } from "@ha-schematic-card/codec";
import { renderSchematicSvg } from "@ha-schematic-card/renderer";
import {
  isSchematicPayload,
  type SchematicPayload,
  type SchematicItem,
  type SchematicPoint,
  validateSchematicPayload
} from "@ha-schematic-card/schema";

import demoPayloadJson from "../../../examples/demo-payloads/minimal.json";

const demoPayload = demoPayloadJson as SchematicPayload;
const DEFAULT_EDITOR_GRID_SIZE = 10;
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

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
  addTextButton: HTMLButtonElement;
  addRectButton: HTMLButtonElement;
  addCircleButton: HTMLButtonElement;
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
  toggleGridButton: HTMLButtonElement;
  gridSizeInput: HTMLInputElement;
  closeTransferPanelButton: HTMLButtonElement;
  importButton: HTMLButtonElement;
  jsonSectionToggle: HTMLButtonElement;
  formatButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
  selectedItemId?: string;
  gridEnabled: boolean;
  gridSize: number;
  dragState?: PreviewDragState;
};

type PreviewDragState = {
  itemId: string;
  startPoint: SchematicPoint;
  startItem: SchematicItem;
  coordinateSpace: SvgCoordinateSpace;
};

type SvgCoordinateSpace = {
  viewBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
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

  const jsonPane = createJsonPane(documentRef);
  const previewPane = createPreviewPane(documentRef);
  const resizeHandle = createResizeHandle(documentRef, shell);
  const transferPanel = createTransferPanel(documentRef);

  const elements: EditorElements = {
    editorRoot: shell,
    jsonInput: getRequiredElement(jsonPane, ".json-input", HTMLTextAreaElement),
    itemList: getRequiredElement(jsonPane, ".item-list", HTMLElement),
    addTextButton: getRequiredElement(jsonPane, ".add-text-button", HTMLButtonElement),
    addRectButton: getRequiredElement(jsonPane, ".add-rect-button", HTMLButtonElement),
    addCircleButton: getRequiredElement(jsonPane, ".add-circle-button", HTMLButtonElement),
    inspector: getRequiredElement(jsonPane, ".property-inspector", HTMLElement),
    inspectorStatus: getRequiredElement(jsonPane, ".inspector-status", HTMLElement),
    previewSurface: getRequiredElement(previewPane, ".preview-surface", HTMLElement),
    themeInput: getRequiredElement(previewPane, ".theme-input", HTMLTextAreaElement),
    themeStatus: getRequiredElement(previewPane, ".theme-status", HTMLElement),
    transferPanel: getRequiredElement(transferPanel, ".transfer-panel", HTMLElement),
    transferPanelTitle: getRequiredElement(transferPanel, ".transfer-panel-title", HTMLElement),
    importSection: getRequiredElement(transferPanel, ".import-section", HTMLElement),
    exportSection: getRequiredElement(transferPanel, ".export-section", HTMLElement),
    importInput: getRequiredElement(transferPanel, ".import-input", HTMLTextAreaElement),
    exportOutput: getRequiredElement(transferPanel, ".payload-output", HTMLTextAreaElement),
    status: getRequiredElement(transferPanel, ".status", HTMLElement),
    copyButton: getRequiredElement(transferPanel, ".copy-button", HTMLButtonElement),
    applyThemeButton: getRequiredElement(previewPane, ".apply-theme-button", HTMLButtonElement),
    openImportButton: getRequiredElement(previewPane, ".open-import-button", HTMLButtonElement),
    openExportButton: getRequiredElement(previewPane, ".open-export-button", HTMLButtonElement),
    toggleGridButton: getRequiredElement(previewPane, ".toggle-grid-button", HTMLButtonElement),
    gridSizeInput: getRequiredElement(previewPane, ".grid-size-input", HTMLInputElement),
    closeTransferPanelButton: getRequiredElement(transferPanel, ".transfer-panel-close", HTMLButtonElement),
    importButton: getRequiredElement(transferPanel, ".import-button", HTMLButtonElement),
    jsonSectionToggle: getRequiredElement(jsonPane, '[data-section-toggle="json-editor-section"]', HTMLButtonElement),
    formatButton: getRequiredElement(jsonPane, ".format-button", HTMLButtonElement),
    resetButton: getRequiredElement(jsonPane, ".reset-button", HTMLButtonElement),
    gridEnabled: true,
    gridSize: DEFAULT_EDITOR_GRID_SIZE
  };

  elements.jsonInput.value = formatPayloadJson();
  elements.jsonInput.addEventListener("input", () => updateFromJson(elements, documentRef));
  elements.copyButton.addEventListener("click", async () => copyExportedPayload(elements));
  elements.applyThemeButton.addEventListener("click", () => applyThemePreview(elements));
  elements.openImportButton.addEventListener("click", () => openTransferPanel(elements, "import"));
  elements.openExportButton.addEventListener("click", () => openTransferPanel(elements, "export"));
  elements.toggleGridButton.addEventListener("click", () => togglePreviewGrid(elements, documentRef));
  elements.gridSizeInput.addEventListener("change", () => updateGridSize(elements, documentRef));
  elements.closeTransferPanelButton.addEventListener("click", () => closeTransferPanel(elements));
  elements.importButton.addEventListener("click", () => importEncodedPayload(elements, documentRef));
  elements.addTextButton.addEventListener("click", () => addItem(elements, "text", documentRef));
  elements.addRectButton.addEventListener("click", () => addItem(elements, "rect", documentRef));
  elements.addCircleButton.addEventListener("click", () => addItem(elements, "circle", documentRef));
  elements.formatButton.addEventListener("click", () => formatCurrentJson(elements, documentRef));
  elements.resetButton.addEventListener("click", () => resetDemoPayload(elements, documentRef));
  shell.addEventListener("keydown", (event) => handleEditorKeyDown(elements, event, documentRef));

  shell.append(jsonPane, resizeHandle, previewPane, transferPanel);
  updateFromJson(elements, documentRef);

  return shell;
}

export function mountEditorApp(root: HTMLElement | null = document.getElementById("app")): void {
  if (!root) {
    return;
  }

  root.replaceChildren(createEditorApp(root.ownerDocument));
}

function updateFromJson(elements: EditorElements, documentRef: Document): void {
  const result = parseAndValidatePayload(elements.jsonInput.value);

  elements.previewSurface.replaceChildren();
  elements.exportOutput.value = "";

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
  renderPreviewGrid(svg, result.payload, elements.gridEnabled, elements.gridSize, documentRef);
  svg.addEventListener("click", (event) => selectPreviewItem(elements, result.payload, event.target, documentRef));
  svg.addEventListener("mousedown", (event) => startPreviewDrag(elements, result.payload, event, documentRef));
  elements.previewSurface.append(svg);
  elements.exportOutput.value = encodePayload(result.payload);
  elements.status.textContent = "Valid payload";
  elements.status.dataset.state = "valid";
  renderItemTools(elements, result.payload, documentRef);
}

function togglePreviewGrid(elements: EditorElements, documentRef: Document): void {
  elements.gridEnabled = !elements.gridEnabled;
  elements.toggleGridButton.setAttribute("aria-pressed", String(elements.gridEnabled));
  elements.toggleGridButton.textContent = elements.gridEnabled ? "Grid On" : "Grid Off";
  updateFromJson(elements, documentRef);
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

  elements.jsonInput.value = formatPayloadJson(result.payload);
  updateFromJson(elements, documentRef);
}

function resetDemoPayload(elements: EditorElements, documentRef: Document): void {
  elements.selectedItemId = undefined;
  elements.jsonInput.value = formatPayloadJson();
  updateFromJson(elements, documentRef);
}

function renderDisabledItemTools(elements: EditorElements, message: string): void {
  elements.itemList.replaceChildren();
  elements.inspector.replaceChildren();
  elements.inspectorStatus.textContent = `Inspector unavailable:\n${message}`;
  elements.inspectorStatus.dataset.state = "error";
}

function addItem(elements: EditorElements, type: "text" | "rect" | "circle", documentRef: Document): void {
  const result = parseAndValidatePayload(elements.jsonInput.value);

  if (!result.ok) {
    renderDisabledItemTools(elements, result.message);
    return;
  }

  const item = createDefaultItem(result.payload, type);
  result.payload.items.push(item);
  elements.selectedItemId = item.id;
  elements.jsonInput.value = formatPayloadJson(result.payload);
  updateFromJson(elements, documentRef);
  jumpToSelectedItemInJson(elements);
}

function createDefaultItem(payload: SchematicPayload, type: "text" | "rect" | "circle"): SchematicItem {
  const centerX = Math.round(payload.viewport.width / 2);
  const centerY = Math.round(payload.viewport.height / 2);
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
  }
}

function createUniqueItemId(payload: SchematicPayload, type: "text" | "rect" | "circle"): string {
  const existingIds = new Set(payload.items.map((item) => item.id));
  let index = 1;

  while (existingIds.has(`${type}-${index}`)) {
    index += 1;
  }

  return `${type}-${index}`;
}

function renderItemTools(elements: EditorElements, payload: SchematicPayload, documentRef: Document): void {
  elements.itemList.replaceChildren();

  if (payload.items.length === 0) {
    elements.selectedItemId = undefined;
    elements.inspector.replaceChildren();
    elements.inspectorStatus.textContent = "No top-level items";
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  const selectedItem = payload.items.find((item) => item.id === elements.selectedItemId) ?? payload.items[0];
  elements.selectedItemId = selectedItem.id;

  for (const item of payload.items) {
    const button = documentRef.createElement("button");
    button.className = "item-list-button";
    button.type = "button";
    button.dataset.itemId = item.id;
    button.textContent = `${item.id} (${item.type})`;
    button.setAttribute("aria-pressed", String(item.id === elements.selectedItemId));
    button.addEventListener("click", () => {
      elements.selectedItemId = item.id;
      renderItemTools(elements, payload, documentRef);
      jumpToSelectedItemInJson(elements);
    });
    elements.itemList.append(button);
  }

  renderInspector(elements, selectedItem, documentRef);
  highlightSelectedPreviewItem(elements);
}

function selectPreviewItem(
  elements: EditorElements,
  payload: SchematicPayload,
  target: EventTarget | null,
  documentRef: Document
): void {
  const itemId = findSelectablePreviewItemId(elements, payload, target);

  if (!itemId) {
    return;
  }

  elements.selectedItemId = itemId;
  renderItemTools(elements, payload, documentRef);
  jumpToSelectedItemInJson(elements);
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

function startPreviewDrag(
  elements: EditorElements,
  payload: SchematicPayload,
  event: MouseEvent,
  documentRef: Document
): void {
  if (event.button !== 0) {
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

  elements.selectedItemId = itemId;
  renderItemTools(elements, payload, documentRef);

  if (!canMoveItem(item)) {
    elements.inspectorStatus.textContent = `${item.type} cannot be dragged yet`;
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
    startItem: cloneItem(item),
    coordinateSpace
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

  moveSelectedItemFromDrag(elements, dx, dy, documentRef);
}

function moveSelectedItemFromDrag(
  elements: EditorElements,
  dx: number,
  dy: number,
  documentRef: Document
): void {
  const result = parseAndValidatePayload(elements.jsonInput.value);

  if (!result.ok) {
    renderDisabledItemTools(elements, result.message);
    return;
  }

  const dragState = elements.dragState;
  const item = dragState
    ? result.payload.items.find((candidate) => candidate.id === dragState.itemId)
    : undefined;

  if (!dragState || !item) {
    elements.inspectorStatus.textContent = "Selected item was not found";
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  if (!moveItemFromStart(item, dragState.startItem, dx, dy)) {
    elements.inspectorStatus.textContent = `${item.type} cannot be dragged yet`;
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  if (elements.gridEnabled) {
    snapItemToGrid(item, elements.gridSize);
  }

  elements.selectedItemId = dragState.itemId;
  elements.jsonInput.value = formatPayloadJson(result.payload);
  updateFromJson(elements, documentRef);
  elements.inspectorStatus.textContent = `Moved ${item.id}`;
  elements.inspectorStatus.dataset.state = "valid";
}

function getSvgCoordinateSpace(svg: SVGSVGElement): SvgCoordinateSpace {
  const rect = svg.getBoundingClientRect();

  return {
    viewBox: parseViewBox(svg.getAttribute("viewBox")),
    bounds: {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    }
  };
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

function parseViewBox(value: string | null): { x: number; y: number; width: number; height: number } | undefined {
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

  if (!elements.selectedItemId) {
    return;
  }

  for (const element of elements.previewSurface.querySelectorAll("[data-id]")) {
    if (element.getAttribute("data-id") === elements.selectedItemId) {
      element.setAttribute("data-editor-selected", "true");
    }
  }
}

function jumpToSelectedItemInJson(elements: EditorElements): void {
  if (!elements.selectedItemId) {
    return;
  }

  const matchIndex = findItemIdIndex(elements.jsonInput.value, elements.selectedItemId);

  if (matchIndex === -1) {
    return;
  }

  expandSection(elements.jsonSectionToggle, elements.jsonInput);
  elements.jsonInput.setSelectionRange(matchIndex, matchIndex + elements.selectedItemId.length + 7);
  elements.jsonInput.scrollTop = estimateTextareaScrollTop(elements.jsonInput.value, matchIndex);
  elements.editorRoot.focus();
}

function findItemIdIndex(json: string, itemId: string): number {
  const itemIdPattern = `"id": "${itemId}"`;
  const itemsIndex = json.indexOf("\"items\": [");
  const searchStart = itemsIndex === -1 ? 0 : itemsIndex;
  return json.indexOf(itemIdPattern, searchStart);
}

function expandSection(toggle: HTMLButtonElement, body: HTMLElement): void {
  if (!body.hidden) {
    return;
  }

  body.hidden = false;
  toggle.setAttribute("aria-expanded", "true");
  toggle.querySelector(".subsection-icon")?.replaceChildren("^^");
  const section = toggle.closest<HTMLElement>(".editor-subsection");

  if (section) {
    section.dataset.collapsed = "false";
  }
}

function estimateTextareaScrollTop(value: string, index: number): number {
  const line = value.slice(0, index).split("\n").length - 1;
  return Math.max(0, line - 3) * 17;
}

function renderInspector(elements: EditorElements, item: SchematicItem, documentRef: Document): void {
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

  const labelText = documentRef.createElement("span");
  labelText.className = "field-label";
  labelText.textContent = fieldName;

  const input = documentRef.createElement("input");
  input.className = "inspector-input";
  input.type = "text";
  input.value = String(getEditableFieldValue(item, fieldName));

  if (valueType === "number") {
    input.inputMode = "decimal";
  }

  input.addEventListener("change", () => {
    updateSelectedItemField(elements, fieldName, input.value, valueType, documentRef);
  });

  label.append(labelText, input);
  elements.inspector.append(label);
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

  (item as Record<string, unknown>)[fieldName] = nextValue;

  if (fieldName === "id") {
    elements.selectedItemId = rawValue;
  }

  elements.jsonInput.value = formatPayloadJson(result.payload);
  updateFromJson(elements, documentRef);
}

function handleEditorKeyDown(elements: EditorElements, event: KeyboardEvent, documentRef: Document): void {
  if (isTypingTarget(event.target)) {
    return;
  }

  const delta = getKeyboardNudgeDelta(event);

  if (!delta) {
    return;
  }

  event.preventDefault();
  nudgeSelectedItem(elements, delta.dx, delta.dy, documentRef);
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

  const item = result.payload.items.find((candidate) => candidate.id === elements.selectedItemId);

  if (!item) {
    elements.inspectorStatus.textContent = "Selected item was not found";
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  if (!moveItem(item, dx, dy)) {
    elements.inspectorStatus.textContent = `${item.type} cannot be nudged yet`;
    elements.inspectorStatus.dataset.state = "error";
    return;
  }

  elements.jsonInput.value = formatPayloadJson(result.payload);
  updateFromJson(elements, documentRef);
  elements.inspectorStatus.textContent = `Moved ${item.id}`;
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

  elements.previewSurface.removeAttribute("style");

  for (const [name, value] of Object.entries(result.variables)) {
    elements.previewSurface.style.setProperty(name, value);
  }

  elements.themeStatus.textContent = `Applied ${Object.keys(result.variables).length} theme variables`;
  elements.themeStatus.dataset.state = "valid";
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

function openTransferPanel(elements: EditorElements, mode: "import" | "export"): void {
  elements.transferPanel.hidden = false;
  elements.transferPanel.dataset.mode = mode;
  elements.transferPanelTitle.textContent = mode === "import" ? "Import Payload" : "Export Payload";
  elements.importSection.hidden = mode !== "import";
  elements.exportSection.hidden = mode !== "export";
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
  const pane = createPane(documentRef, "Decoded JSON");
  const controls = documentRef.createElement("div");
  controls.className = "json-controls";

  const formatButton = documentRef.createElement("button");
  formatButton.className = "format-button utility-button";
  formatButton.type = "button";
  formatButton.textContent = "Format JSON";

  const resetButton = documentRef.createElement("button");
  resetButton.className = "reset-button utility-button";
  resetButton.type = "button";
  resetButton.textContent = "Reset Demo";

  const jsonInput = documentRef.createElement("textarea");
  jsonInput.className = "json-input";
  jsonInput.spellcheck = false;

  const itemTools = documentRef.createElement("section");
  itemTools.className = "item-tools";

  const addTools = documentRef.createElement("section");
  addTools.className = "add-item-tools";

  const addLabel = documentRef.createElement("div");
  addLabel.className = "field-label";
  addLabel.textContent = "Add";

  const addButtons = documentRef.createElement("div");
  addButtons.className = "add-item-buttons";

  const addTextButton = documentRef.createElement("button");
  addTextButton.className = "add-text-button utility-button";
  addTextButton.type = "button";
  addTextButton.textContent = "Text";

  const addRectButton = documentRef.createElement("button");
  addRectButton.className = "add-rect-button utility-button";
  addRectButton.type = "button";
  addRectButton.textContent = "Rect";

  const addCircleButton = documentRef.createElement("button");
  addCircleButton.className = "add-circle-button utility-button";
  addCircleButton.type = "button";
  addCircleButton.textContent = "Circle";

  addButtons.append(addTextButton, addRectButton, addCircleButton);
  addTools.append(addLabel, addButtons);

  const itemListSection = documentRef.createElement("section");
  itemListSection.className = "item-list-section";

  const itemListLabel = documentRef.createElement("div");
  itemListLabel.className = "field-label";
  itemListLabel.textContent = "Items";

  const itemList = documentRef.createElement("div");
  itemList.className = "item-list";

  const inspectorSection = documentRef.createElement("section");
  inspectorSection.className = "inspector-section";

  const inspectorLabel = documentRef.createElement("div");
  inspectorLabel.className = "field-label";
  inspectorLabel.textContent = "Inspector";

  const inspector = documentRef.createElement("div");
  inspector.className = "property-inspector";

  const inspectorStatus = documentRef.createElement("span");
  inspectorStatus.className = "inspector-status";
  inspectorStatus.textContent = "Select an item";

  itemListSection.append(itemListLabel, itemList);
  inspectorSection.append(inspectorLabel, inspector, inspectorStatus);
  itemTools.append(addTools, itemListSection, inspectorSection);

  controls.append(formatButton, resetButton);
  pane.querySelector(".pane-header")?.append(controls);
  pane.append(
    createCollapsibleSection(documentRef, "Items / Inspector", "item-tools-section", itemTools),
    createCollapsibleSection(documentRef, "Decoded JSON", "json-editor-section", jsonInput)
  );
  return pane;
}

function createCollapsibleSection(
  documentRef: Document,
  title: string,
  className: string,
  body: HTMLElement
): HTMLElement {
  const section = documentRef.createElement("section");
  section.className = `editor-subsection ${className}`;

  const toggle = documentRef.createElement("button");
  toggle.className = "subsection-toggle";
  toggle.type = "button";
  toggle.dataset.sectionToggle = className;
  toggle.setAttribute("aria-expanded", "true");

  const titleElement = documentRef.createElement("span");
  titleElement.className = "subsection-title";
  titleElement.textContent = title;

  const icon = documentRef.createElement("span");
  icon.className = "subsection-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "^^";

  body.classList.add("subsection-body");

  toggle.addEventListener("click", () => {
    const collapsed = !body.hidden;
    body.hidden = collapsed;
    section.dataset.collapsed = String(collapsed);
    toggle.setAttribute("aria-expanded", String(!collapsed));
    icon.textContent = collapsed ? "vv" : "^^";
  });

  toggle.append(titleElement, icon);
  section.append(toggle, body);
  return section;
}

function createPreviewPane(documentRef: Document): HTMLElement {
  const pane = createPane(documentRef, "Preview");
  const controls = documentRef.createElement("div");
  controls.className = "preview-controls";

  const openImportButton = documentRef.createElement("button");
  openImportButton.className = "open-import-button utility-button";
  openImportButton.type = "button";
  openImportButton.textContent = "Import";

  const openExportButton = documentRef.createElement("button");
  openExportButton.className = "open-export-button utility-button";
  openExportButton.type = "button";
  openExportButton.textContent = "Export";

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

  controls.append(toggleGridButton, gridSizeLabel, openImportButton, openExportButton);
  pane.querySelector(".pane-header")?.append(controls);

  const themeSection = documentRef.createElement("section");
  themeSection.className = "theme-section";

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
  pane.append(themeSection, createPreviewSurface(documentRef));
  return pane;
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
  panel.append(header, statusRow, importSection, exportSection);
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
