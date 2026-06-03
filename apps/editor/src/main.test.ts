import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";

import {
  createEditorApp,
  encodeDemoPayload,
  formatPayloadJson,
  getDemoPayload,
  parseSvgImport
} from "./main";

function createDocument(): Document {
  return new Window().document as unknown as Document;
}

describe("editor app", () => {
  it("encodes the demo payload as hsc1", () => {
    expect(encodeDemoPayload(getDemoPayload()).startsWith("hsc1.")).toBe(true);
  });

  it("starts with decoded JSON, preview SVG, and exported payload", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    expect(app.querySelector(".editor-topbar")).not.toBeNull();
    expect(getButton(app, ".select-tool-button").getAttribute("aria-pressed")).toBe("true");
    expect(app.querySelector<HTMLTextAreaElement>(".json-input")?.value).toBe(formatPayloadJson());
    expect(app.querySelector("svg")).not.toBeNull();
    expect(app.querySelector('[data-editor-grid="true"]')).not.toBeNull();
    expect(app.querySelector<HTMLTextAreaElement>(".payload-output")?.value.startsWith("hsc1.")).toBe(true);
    expect(app.querySelector<HTMLElement>(".status")?.textContent).toBe("Valid payload");
  });

  it("switches between item and inspector tabs", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const itemsTab = getButton(app, '[data-editor-tab="items"]');
    const inspectorTab = getButton(app, '[data-editor-tab="inspector"]');
    const itemListSection = app.querySelector<HTMLElement>(".item-list-section");
    const inspectorSection = app.querySelector<HTMLElement>(".inspector-section");

    if (!itemListSection || !inspectorSection) {
      throw new Error("tab sections missing");
    }

    expect(itemsTab.getAttribute("aria-selected")).toBe("true");
    expect(itemListSection.hidden).toBe(false);
    expect(inspectorSection.hidden).toBe(true);

    inspectorTab.click();

    expect(itemsTab.getAttribute("aria-selected")).toBe("false");
    expect(inspectorTab.getAttribute("aria-selected")).toBe("true");
    expect(itemListSection.hidden).toBe(true);
    expect(inspectorSection.hidden).toBe(false);
  });

  it("updates preview and export when JSON changes", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const jsonInput = app.querySelector<HTMLTextAreaElement>(".json-input");

    if (!jsonInput) {
      throw new Error("json input missing");
    }

    const updatedPayload = {
      ...getDemoPayload(),
      viewport: {
        width: 500,
        height: 200
      }
    };
    jsonInput.value = formatPayloadJson(updatedPayload);
    jsonInput.dispatchEvent(new Event("input"));

    expect(app.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 500 200");
    expect(app.querySelector<HTMLTextAreaElement>(".payload-output")?.value.startsWith("hsc1.")).toBe(true);
  });

  it("lists top-level items and edits text through the inspector", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const titleButton = getButton(app, '[data-item-id="demo-title"]');

    expect(app.querySelector(".item-list-section")).not.toBeNull();
    expect(app.querySelectorAll(".item-list-button").length).toBe(getDemoPayload().items.length);
    expect(titleButton.textContent).toBe("demo-title (text)");

    titleButton.click();
    expect(app.querySelector<HTMLElement>(".inspector-status")?.textContent).toBe("Selected demo-title");
    getInspectorInput(app, "text").value = "Edited Demo";
    getInspectorInput(app, "text").dispatchEvent(new Event("change"));

    expect(getTextarea(app, ".json-input").value).toContain("\"text\": \"Edited Demo\"");
    expect(app.querySelector("svg")?.textContent).toContain("Edited Demo");
    expect(app.querySelector<HTMLTextAreaElement>(".payload-output")?.value.startsWith("hsc1.")).toBe(true);
  });

  it("shows symbol part and entity slot metadata in the item panel", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const summary = app.querySelector<HTMLElement>(".symbol-summary");

    expect(summary?.hidden).toBe(false);
    expect(summary?.textContent).toContain("demo-generic-unit");
    expect(summary?.textContent).toContain("Parts: body, label, status");
    expect(summary?.textContent).toContain("Slots: running, alarm");
  });

  it("shows selected symbol metadata in the inspector", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, '[data-item-id="demo-component-a"]').click();

    const section = app.querySelector<HTMLElement>(".symbol-inspector-section");

    expect(section?.textContent).toContain("Symbol metadata");
    expect(section?.textContent).toContain("Definition: demo-generic-unit");
    expect(section?.textContent).toContain("body - Symbol body");
    expect(section?.textContent).toContain("unit-box");
    expect(section?.textContent).toContain("status - Status indicator");
    expect(section?.textContent).toContain("unit-status-dot");
    expect(section?.textContent).toContain("Part dynamic styles");
    expect(section?.textContent).toContain("body when slot:alarm = on");
    expect(section?.textContent).toContain("Part animations");
    expect(section?.textContent).toContain("status blink when slot:running = on");
    expect(section?.textContent).toContain("running - Running state");
    expect(section?.textContent).toContain("alarm - Alarm state");
    expect(getSymbolSlotBindingInput(app, "running").value).toBe("input_boolean.schematic_demo_flow");
    expect(getSymbolSlotBindingInput(app, "alarm").value).toBe("input_boolean.schematic_demo_alarm");
  });

  it("edits selected symbol slot bindings through the inspector", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, '[data-item-id="demo-component-a"]').click();
    getSymbolSlotBindingInput(app, "alarm").value = "binary_sensor.demo_alarm";
    getSymbolSlotBindingInput(app, "alarm").dispatchEvent(new Event("change"));

    expect(getPayloadItem(app, "demo-component-a")?.slotBindings).toMatchObject({
      alarm: "binary_sensor.demo_alarm",
      running: "input_boolean.schematic_demo_flow"
    });
    expect(getTextarea(app, ".payload-output").value.startsWith("hsc1.")).toBe(true);

    getSymbolSlotBindingInput(app, "alarm").value = "";
    getSymbolSlotBindingInput(app, "alarm").dispatchEvent(new Event("change"));

    expect(getPayloadItem(app, "demo-component-a")?.slotBindings).toEqual({
      running: "input_boolean.schematic_demo_flow"
    });
  });

  it("opens a dedicated symbol editor workspace for existing symbols", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, ".open-symbol-editor-button").click();

    const workspace = app.querySelector<HTMLElement>(".symbol-editor-workspace");
    const symbolSelect = app.querySelector<HTMLSelectElement>(".symbol-select");

    expect(workspace?.hidden).toBe(false);
    expect(app.querySelector<HTMLElement>(".symbol-start-dialog")?.hidden).toBe(false);
    getButton(app, ".symbol-start-edit-button").click();
    expect(app.querySelector<HTMLElement>(".symbol-start-dialog")?.hidden).toBe(true);
    expect(symbolSelect?.value).toBe("demo-generic-unit");
    expect(app.querySelector(".symbol-preview-surface svg")).not.toBeNull();
    expect(getButton(app, '[data-symbol-item-id="unit-box"]').textContent).toContain("unit-box (rect, body)");
    expect(app.querySelector<HTMLElement>(".symbol-parts-list")?.textContent).toContain("body - Symbol body");
    expect(app.querySelector<HTMLElement>(".symbol-slots-list")?.textContent).toContain("running - Running state");

    getButton(app, ".symbol-file-menu-button").click();
    expect(app.querySelector<HTMLElement>(".symbol-file-menu")?.hidden).toBe(false);
    getButton(app, ".open-symbol-svg-import-dialog-button").click();
    expect(app.querySelector<HTMLElement>(".symbol-import-dialog")?.hidden).toBe(false);
    getButton(app, ".cancel-symbol-import-button").click();
    expect(app.querySelector<HTMLElement>(".symbol-import-dialog")?.hidden).toBe(true);

    getButton(app, ".close-symbol-workspace-button").click();
    expect(workspace?.hidden).toBe(true);
  });

  it("selects internal symbol items inside the symbol editor workspace", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, ".open-symbol-editor-button").click();
    getButton(app, ".symbol-start-edit-button").click();
    getButton(app, '[data-symbol-item-id="unit-status-dot"]').click();

    expect(getButton(app, '[data-symbol-item-id="unit-status-dot"]').getAttribute("aria-pressed")).toBe("true");
    expect(app.querySelector('.symbol-preview-surface [data-id="unit-status-dot"]')?.getAttribute("data-symbol-editor-selected")).toBe("true");
    expect(app.querySelector<HTMLElement>(".symbol-editor-inspector")?.textContent).toContain("Item: unit-status-dot");
    expect(app.querySelector<HTMLElement>(".symbol-editor-inspector")?.textContent).toContain("Part: status");
  });

  it("selects and edits nested imported symbol items in the symbol editor workspace", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, ".open-symbol-editor-button").click();
    getButton(app, ".symbol-start-edit-button").click();
    getButton(app, ".symbol-file-menu-button").click();
    getButton(app, ".open-symbol-svg-import-dialog-button").click();
    getTextarea(app, ".symbol-svg-import-input").value = `
      <svg viewBox="0 0 100 80">
        <path id="symbol-import-body" d="M 10 10 H 90 V 60 H 10 Z" fill="#000000" />
        <path id="symbol-import-mark" d="M 25 40 H 75" stroke="#ffffff" stroke-width="4" fill="none" />
      </svg>
    `;
    getButton(app, ".symbol-svg-import-button").click();

    getButton(app, '[data-symbol-item-id="symbol-import-body"]').click();

    expect(getButton(app, '[data-symbol-item-id="symbol-import-body"]').getAttribute("aria-pressed")).toBe("true");
    expect(app.querySelector('.symbol-preview-surface [data-id="symbol-import-body"]')?.getAttribute("data-symbol-editor-selected")).toBe("true");
    expect(app.querySelector<HTMLElement>(".symbol-editor-inspector")?.textContent).toContain("Item: symbol-import-body (path)");

    const partSelect = app.querySelector<HTMLSelectElement>(".symbol-part-select");

    if (!partSelect) {
      throw new Error("symbol part select missing");
    }

    partSelect.value = "body";
    partSelect.dispatchEvent(new Event("change"));

    expect(getSymbolInternalItem(app, "demo-generic-unit", "symbol-import-body")?.partId).toBe("body");

    const fillInput = app.querySelector<HTMLInputElement>('.symbol-style-input[data-style-field="fill"]');

    if (!fillInput) {
      throw new Error("symbol fill input missing");
    }

    fillInput.value = "#ff0000";
    fillInput.dispatchEvent(new Event("change"));

    expect(getSymbolInternalItem(app, "demo-generic-unit", "symbol-import-body")?.style?.fill).toBe("#ff0000");
    expect(getTextarea(app, ".payload-output").value.startsWith("hsc1.")).toBe(true);
  });

  it("creates a symbol part from the selected internal symbol item", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, ".open-symbol-editor-button").click();
    getButton(app, ".symbol-start-edit-button").click();
    getButton(app, '[data-symbol-item-id="unit-status-dot"]').click();
    getInput(app, ".symbol-new-part-input").value = "indicator";
    getButton(app, ".symbol-create-part-button").click();

    const symbol = getSymbol(app, "demo-generic-unit");

    expect(symbol?.parts?.some((part) => part.id === "indicator")).toBe(true);
    expect(getSymbolInternalItem(app, "demo-generic-unit", "unit-status-dot")?.partId).toBe("indicator");
  });

  it("edits symbol parts and slots from the symbol editor manager", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, ".open-symbol-editor-button").click();
    getButton(app, ".symbol-start-edit-button").click();

    const bodyLabel = getInput(app, '.symbol-part-row[data-part-id="body"] .symbol-part-label-input');
    bodyLabel.value = "Main body";
    bodyLabel.dispatchEvent(new Event("change"));

    expect(getSymbol(app, "demo-generic-unit")?.parts?.find((part) => part.id === "body")?.label).toBe("Main body");

    getInput(app, ".symbol-add-slot-input").value = "temperature";
    getButton(app, ".symbol-add-slot-button").click();

    expect(getSymbol(app, "demo-generic-unit")?.entitySlots?.some((slot) => slot.id === "temperature")).toBe(true);

    const temperatureLabel = getInput(app, '.symbol-slot-row[data-slot-id="temperature"] .symbol-slot-label-input');
    temperatureLabel.value = "Temperature";
    temperatureLabel.dispatchEvent(new Event("change"));

    expect(getSymbol(app, "demo-generic-unit")?.entitySlots?.find((slot) => slot.id === "temperature")?.label).toBe("Temperature");
    expect(app.querySelector('.symbol-slot-row[data-slot-id="temperature"]')?.textContent).toContain("No effect configured");
    expect(app.querySelector('.symbol-slot-row[data-slot-id="temperature"] .symbol-slot-simulation-input')).not.toBeNull();
    expect(app.querySelector<HTMLSelectElement>('.symbol-slot-row[data-slot-id="temperature"] .symbol-slot-type-select')?.value).toBe("temperature");

    getInput(app, ".symbol-add-slot-input").value = "speed_percent";
    getButton(app, ".symbol-add-slot-button").click();

    expect(app.querySelector('.symbol-slot-row[data-slot-id="speed_percent"] .symbol-slot-simulation-slider')).not.toBeNull();

    const speedType = app.querySelector<HTMLSelectElement>('.symbol-slot-row[data-slot-id="speed_percent"] .symbol-slot-type-select');
    expect(speedType?.value).toBe("percent");
    speedType!.value = "text";
    speedType!.dispatchEvent(new Event("change"));

    expect(getSymbol(app, "demo-generic-unit")?.entitySlots?.find((slot) => slot.id === "speed_percent")?.valueType).toBe("text");
    expect(app.querySelector('.symbol-slot-row[data-slot-id="speed_percent"] .symbol-slot-simulation-input')).not.toBeNull();
    expect(getTextarea(app, ".payload-output").value.startsWith("hsc1.")).toBe(true);
  });

  it("simulates symbol slot states in the symbol preview", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, ".open-symbol-editor-button").click();
    getButton(app, ".symbol-start-edit-button").click();

    expect(app.querySelector('.symbol-preview-surface [data-id="unit-box"]')?.getAttribute("fill")).not.toBe("var(--error-color)");
    expect(app.querySelector('.symbol-preview-surface [data-id="unit-status-dot"]')?.getAttribute("data-part-animation")).toBeNull();

    expect(app.querySelector('.symbol-slot-row[data-slot-id="alarm"]')?.textContent).toContain("Affects: body style when alarm = on");
    getButton(app, '.symbol-slot-row[data-slot-id="alarm"] .symbol-slot-simulation-on-button').click();

    expect(app.querySelector('.symbol-preview-surface [data-id="unit-box"]')?.getAttribute("fill")).toBe("var(--error-color)");

    getButton(app, '.symbol-slot-row[data-slot-id="running"] .symbol-slot-simulation-on-button').click();

    expect(app.querySelector('.symbol-preview-surface [data-id="unit-status-dot"]')?.getAttribute("data-part-animation")).toBe("blink");
  });

  it("zooms, pans, clears, drags, and deletes symbol items in the symbol editor preview", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, ".open-symbol-editor-button").click();
    getButton(app, ".symbol-start-edit-button").click();

    const svg = app.querySelector<SVGSVGElement>(".symbol-preview-surface svg");
    const statusDot = app.querySelector<Element>('.symbol-preview-surface [data-id="unit-status-dot"]');

    if (!svg || !statusDot) {
      throw new Error("symbol preview target missing");
    }

    setSvgBounds(svg, { left: 0, top: 0, width: 320, height: 280 });
    const wheelEvent = new MouseEvent("wheel", {
      clientX: 160,
      clientY: 140,
      bubbles: true,
      cancelable: true
    });
    Object.defineProperty(wheelEvent, "deltaY", { value: -100 });
    svg.dispatchEvent(wheelEvent);

    expect(svg.getAttribute("viewBox")?.endsWith("57.6 50.4")).toBe(true);

    getButton(app, ".symbol-pan-tool-button").click();
    svg.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 100, clientY: 80, bubbles: true }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 120, clientY: 110 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    expect(svg.getAttribute("viewBox")?.endsWith("57.6 50.4")).toBe(true);

    getButton(app, ".symbol-reset-view-button").click();
    expect(svg.getAttribute("viewBox")).toBe("0 0 64 56");

    getButton(app, ".symbol-select-tool-button").click();
    statusDot.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 48, clientY: 12, bubbles: true }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 58, clientY: 22 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    expect(getSymbolInternalItem(app, "demo-generic-unit", "unit-status-dot")?.cx).toBe(54);
    expect(getSymbolInternalItem(app, "demo-generic-unit", "unit-status-dot")?.cy).toBe(14);

    getButton(app, ".symbol-clear-selection-button").click();
    expect(getButton(app, ".symbol-delete-item-button").disabled).toBe(true);

    getButton(app, '[data-symbol-item-id="unit-status-dot"]').click();
    getButton(app, ".symbol-delete-item-button").click();

    expect(getSymbolInternalItem(app, "demo-generic-unit", "unit-status-dot")).toBeUndefined();
  });

  it("multi-selects and deletes symbol internal items", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, ".open-symbol-editor-button").click();
    getButton(app, ".symbol-start-edit-button").click();

    getButton(app, '[data-symbol-item-id="unit-box"]').click();
    getButton(app, '[data-symbol-item-id="unit-label"]').dispatchEvent(new MouseEvent("click", { ctrlKey: true, bubbles: true }));

    expect(app.querySelector(".symbol-editor-inspector")?.textContent).toContain("2 internal items selected");

    getButton(app, ".symbol-delete-item-button").click();

    expect(getSymbolInternalItem(app, "demo-generic-unit", "unit-box")).toBeUndefined();
    expect(getSymbolInternalItem(app, "demo-generic-unit", "unit-label")).toBeUndefined();

    getButton(app, ".symbol-undo-button").click();

    expect(getSymbolInternalItem(app, "demo-generic-unit", "unit-box")).toBeDefined();
    expect(getSymbolInternalItem(app, "demo-generic-unit", "unit-label")).toBeDefined();
  });

  it("creates a first symbol from the symbol editor workspace", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const payloadWithoutSymbols = {
      ...getDemoPayload(),
      symbols: undefined,
      items: getDemoPayload().items.filter((item) => item.type !== "symbol")
    };
    const jsonInput = getTextarea(app, ".json-input");

    jsonInput.value = formatPayloadJson(payloadWithoutSymbols);
    jsonInput.dispatchEvent(new Event("input"));
    getButton(app, ".open-symbol-editor-button").click();
    getButton(app, ".symbol-start-edit-button").click();

    expect(app.querySelector<HTMLElement>(".symbol-editor-inspector")?.textContent).toContain("Create a symbol");

    getButton(app, ".create-symbol-button").click();

    const parsed = JSON.parse(jsonInput.value) as { symbols?: Array<{ id: string; items: Array<{ id: string }> }> };

    expect(parsed.symbols?.[0]?.id).toBe("symbol-1");
    expect(parsed.symbols?.[0]?.items[0]?.id).toBe("symbol-1-body");
    expect(app.querySelector<HTMLSelectElement>(".symbol-select")?.value).toBe("symbol-1");
    expect(getButton(app, '[data-symbol-item-id="symbol-1-body"]').getAttribute("aria-pressed")).toBe("true");
  });

  it("imports SVG into the selected symbol instead of top-level items", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const jsonInput = getTextarea(app, ".json-input");
    const beforeTopLevelCount = getDemoPayload().items.length;

    getButton(app, ".open-symbol-editor-button").click();
    getButton(app, ".symbol-start-import-button").click();
    getTextarea(app, ".symbol-svg-import-input").value = `
      <svg viewBox="0 0 100 80">
        <path id="symbol-import-body" d="M 10 10 H 90 V 60 H 10 Z" fill="#000000" />
        <path id="symbol-import-mark" d="M 25 40 H 75" stroke="#ffffff" stroke-width="4" fill="none" />
      </svg>
    `;
    getButton(app, ".symbol-svg-import-button").click();

    const parsed = JSON.parse(jsonInput.value) as {
      items: Array<{ id: string }>;
      symbols?: Array<{ id: string; items: Array<{ id: string; type: string; children?: Array<{ id: string; type: string }> }> }>;
    };
    const symbol = parsed.symbols?.find((candidate) => candidate.id === "imported-symbol-1");
    const importedGroup = symbol?.items.find((item) => item.id === "imported-svg-1");

    expect(parsed.items).toHaveLength(beforeTopLevelCount);
    expect(importedGroup).toMatchObject({ type: "group" });
    expect(importedGroup?.children?.map((child) => child.id)).toEqual(["symbol-import-body", "symbol-import-mark"]);
    expect(getButton(app, '[data-symbol-item-id="imported-svg-1"]').getAttribute("aria-pressed")).toBe("true");
    expect(app.querySelector(".symbol-preview-surface [data-id='symbol-import-body']")).not.toBeNull();
    expect(getTextarea(app, ".payload-output").value.startsWith("hsc1.")).toBe(true);
    expect(app.querySelector<HTMLElement>(".symbol-workspace-status")?.textContent).toContain("Imported 1 SVG item(s) into imported-symbol-1");
    expect(app.querySelector<HTMLElement>(".symbol-import-dialog")?.hidden).toBe(true);
  });

  it("does not change JSON when Symbol Editor SVG import is unsafe", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const jsonInput = getTextarea(app, ".json-input");
    const originalJson = jsonInput.value;

    getButton(app, ".open-symbol-editor-button").click();
    getButton(app, ".symbol-start-edit-button").click();
    getButton(app, ".symbol-file-menu-button").click();
    getButton(app, ".open-symbol-svg-import-dialog-button").click();
    getTextarea(app, ".symbol-svg-import-input").value = `
      <svg>
        <script>alert(1)</script>
        <path id="bad" d="M 0 0 L 10 10" />
      </svg>
    `;
    getButton(app, ".symbol-svg-import-button").click();

    expect(jsonInput.value).toBe(originalJson);
    expect(app.querySelector<HTMLElement>(".symbol-workspace-status")?.textContent).toContain("SVG import error:");
  });

  it("docks a tab into a split panel and undocks it back to the tab row", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const itemsTab = getButton(app, '[data-editor-tab="items"]');
    const inspectorTab = getButton(app, '[data-editor-tab="inspector"]');
    const tabRow = app.querySelector<HTMLElement>(".editor-tabs");
    const dropZone = app.querySelector<HTMLElement>(".editor-tab-drop-zone");
    const dockedPanel = app.querySelector<HTMLElement>(".editor-docked-panel");
    const dockedPanelTab = app.querySelector<HTMLButtonElement>(".editor-docked-tab");
    const inspectorSection = app.querySelector<HTMLElement>(".inspector-section");

    if (!tabRow || !dropZone || !dockedPanel || !dockedPanelTab || !inspectorSection) {
      throw new Error("dockable tab elements missing");
    }

    inspectorTab.dispatchEvent(new Event("dragstart", { bubbles: true }));
    dropZone.dispatchEvent(new Event("dragover", { bubbles: true, cancelable: true }));

    expect(dropZone.dataset.dropTarget).toBe("true");

    dropZone.dispatchEvent(new Event("drop", { bubbles: true, cancelable: true }));

    expect(dockedPanel.hidden).toBe(false);
    expect(inspectorSection.parentElement).toBe(dockedPanel);
    expect(inspectorSection.hidden).toBe(false);
    expect(inspectorTab.dataset.docked).toBe("true");
    expect(dockedPanelTab.hidden).toBe(false);
    expect(dockedPanelTab.textContent).toBe("Inspector");
    expect(itemsTab.getAttribute("aria-selected")).toBe("true");

    dockedPanelTab.dispatchEvent(new Event("dragstart", { bubbles: true }));
    tabRow.dispatchEvent(new Event("dragover", { bubbles: true, cancelable: true }));

    expect(tabRow.dataset.dropTarget).toBe("true");

    tabRow.dispatchEvent(new Event("drop", { bubbles: true, cancelable: true }));

    expect(dockedPanel.hidden).toBe(true);
    expect(dockedPanelTab.hidden).toBe(true);
    expect(inspectorSection.parentElement?.classList.contains("editor-primary-panel")).toBe(true);
    expect(inspectorTab.dataset.docked).toBe("false");
    expect(inspectorTab.getAttribute("aria-selected")).toBe("true");
  });

  it("selects a top-level item when clicking it in the preview", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const previewItem = app.querySelector('[data-id="demo-component-a"]');

    if (!previewItem) {
      throw new Error("preview item missing");
    }

    previewItem.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(getButton(app, '[data-item-id="demo-component-a"]').getAttribute("aria-pressed")).toBe("true");
    expect(getButton(app, '[data-editor-tab="items"]').getAttribute("aria-selected")).toBe("true");
    expect(app.querySelector<HTMLElement>(".inspector-status")?.textContent).toBe("Selected demo-component-a");
    expect(app.querySelector('[data-id="demo-component-a"]')?.getAttribute("data-editor-selected")).toBe("true");
  });

  it("keeps selection in the inspector until the JSON tab is opened manually", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const jsonInput = getTextarea(app, ".json-input");
    const jsonTab = getButton(app, '[data-editor-tab="json"]');
    const jsonSection = app.querySelector<HTMLElement>(".json-editor-section");
    const alarmLabelButton = getButton(app, '[data-item-id="demo-alarm-label"]');

    expect(jsonSection?.hidden).toBe(true);

    alarmLabelButton.click();

    expect(getButton(app, '[data-editor-tab="inspector"]').getAttribute("aria-selected")).toBe("true");
    expect(jsonSection?.hidden).toBe(true);

    jsonTab.click();

    expect(jsonSection?.hidden).toBe(false);
    expect(jsonTab.getAttribute("aria-selected")).toBe("true");
    const selectedJson = jsonInput.value.slice(jsonInput.selectionStart, jsonInput.selectionEnd);

    expect(selectedJson).toContain("\"id\": \"demo-alarm-label\"");
    expect(selectedJson).toContain("\"text\": \"ALARM\"");
    expect(selectedJson.trim().startsWith("{")).toBe(true);
    expect(selectedJson.trim().endsWith("}")).toBe(true);
    expect(jsonInput.scrollTop).toBeGreaterThan(0);
  });

  it("does not force the JSON tab open when selecting from the preview", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const jsonInput = getTextarea(app, ".json-input");
    const jsonTab = getButton(app, '[data-editor-tab="json"]');
    const inspectorTab = getButton(app, '[data-editor-tab="inspector"]');
    const jsonSection = app.querySelector<HTMLElement>(".json-editor-section");
    const previewItem = app.querySelector('[data-id="demo-component-b"]');

    if (!previewItem) {
      throw new Error("preview item missing");
    }

    previewItem.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(inspectorTab.getAttribute("aria-selected")).toBe("false");
    expect(jsonSection?.hidden).toBe(true);

    jsonTab.click();

    const selectedJson = jsonInput.value.slice(jsonInput.selectionStart, jsonInput.selectionEnd);

    expect(selectedJson).toContain("\"id\": \"demo-component-b\"");
    expect(selectedJson).toContain("\"type\": \"symbol\"");
    expect(selectedJson.trim().startsWith("{")).toBe(true);
    expect(selectedJson.trim().endsWith("}")).toBe(true);
  });

  it("updates JSON selection when the JSON tab is already active", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const jsonInput = getTextarea(app, ".json-input");
    const jsonTab = getButton(app, '[data-editor-tab="json"]');
    const previewItem = app.querySelector('[data-id="demo-component-b"]');

    if (!previewItem) {
      throw new Error("preview item missing");
    }

    jsonTab.click();
    jsonInput.setSelectionRange(0, 0);
    previewItem.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const selectedJson = jsonInput.value.slice(jsonInput.selectionStart, jsonInput.selectionEnd);

    expect(jsonTab.getAttribute("aria-selected")).toBe("true");
    expect(selectedJson).toContain("\"id\": \"demo-component-b\"");
    expect(selectedJson).toContain("\"type\": \"symbol\"");
    expect(selectedJson.trim().startsWith("{")).toBe(true);
    expect(selectedJson.trim().endsWith("}")).toBe(true);
    expect(jsonInput.scrollTop).toBeGreaterThan(0);
  });

  it("clears selection from empty preview clicks and Escape", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const previewItem = app.querySelector('[data-id="demo-component-a"]');
    const svg = app.querySelector("svg");

    if (!previewItem || !svg) {
      throw new Error("preview elements missing");
    }

    previewItem.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(getButton(app, '[data-item-id="demo-component-a"]').getAttribute("aria-pressed")).toBe("true");

    svg.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(getButton(app, '[data-item-id="demo-component-a"]').getAttribute("aria-pressed")).toBe("false");
    expect(previewItem.getAttribute("data-editor-selected")).toBeNull();
    expect(app.querySelector<HTMLElement>(".inspector-status")?.textContent).toBe("Select an item");
    expect(getButton(app, ".duplicate-item-button").disabled).toBe(true);

    previewItem.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    app.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(getButton(app, '[data-item-id="demo-component-a"]').getAttribute("aria-pressed")).toBe("false");
    expect(app.querySelector<HTMLElement>(".inspector-status")?.textContent).toBe("Select an item");
  });

  it("selects a top-level symbol when clicking one of its rendered child elements", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const symbol = app.querySelector('[data-id="demo-component-a"]');
    const child = symbol?.querySelector('[data-id="unit-box"]');

    if (!child) {
      throw new Error("symbol child missing");
    }

    child.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(getButton(app, '[data-item-id="demo-component-a"]').getAttribute("aria-pressed")).toBe("true");
    expect(app.querySelector('[data-id="demo-component-a"]')?.getAttribute("data-editor-selected")).toBe("true");
  });

  it("edits x and y coordinates through the inspector", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const titleButton = getButton(app, '[data-item-id="demo-title"]');

    titleButton.click();
    getInspectorInput(app, "x").value = "42";
    getInspectorInput(app, "x").dispatchEvent(new Event("change"));
    getInspectorInput(app, "y").value = "24";
    getInspectorInput(app, "y").dispatchEvent(new Event("change"));
    const editedText = [...app.querySelectorAll("text")].find((element) => element.textContent === "Schematic Demo");

    expect(getTextarea(app, ".json-input").value).toContain("\"x\": 42");
    expect(getTextarea(app, ".json-input").value).toContain("\"y\": 24");
    expect(editedText?.getAttribute("x")).toBe("42");
    expect(editedText?.getAttribute("y")).toBe("24");
  });

  it("undoes and redoes inspector field edits", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, '[data-item-id="demo-title"]').click();
    getInspectorInput(app, "x").value = "42";
    getInspectorInput(app, "x").dispatchEvent(new Event("change"));

    expect(getTextarea(app, ".json-input").value).toContain("\"x\": 42");

    getButton(app, ".undo-button").click();

    expect(getTextarea(app, ".json-input").value).toContain("\"x\": 16");

    getButton(app, ".redo-button").click();

    expect(getTextarea(app, ".json-input").value).toContain("\"x\": 42");
  });

  it("edits text item style fields and supports undo and redo", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, '[data-item-id="demo-title"]').click();
    expect(getInspectorField(app, "fill").querySelector(".field-label")?.textContent).toBe("Fill / inside color");
    expect(getInspectorField(app, "opacity").querySelector(".field-label")?.textContent).toBe("Opacity 0-100%");
    getInspectorInput(app, "fill").value = "#ff0000";
    getInspectorInput(app, "fill").dispatchEvent(new Event("change"));
    getInspectorInput(app, "fontSize").value = "18";
    getInspectorInput(app, "fontSize").dispatchEvent(new Event("change"));
    getInspectorInput(app, "textAnchor").value = "start";
    getInspectorInput(app, "textAnchor").dispatchEvent(new Event("change"));

    const title = app.querySelector('[data-id="demo-title"]');

    expect(getPayloadItem(app, "demo-title")?.style).toMatchObject({
      fill: "#ff0000",
      fontSize: 18,
      textAnchor: "start"
    });
    expect(title?.getAttribute("fill")).toBe("#ff0000");
    expect(title?.getAttribute("font-size")).toBe("18");
    expect(title?.getAttribute("text-anchor")).toBe("start");
    expect(getTextarea(app, ".payload-output").value.startsWith("hsc1.")).toBe(true);

    getButton(app, ".undo-button").click();

    expect(getPayloadItem(app, "demo-title")?.style?.textAnchor).toBeUndefined();

    getButton(app, ".redo-button").click();

    expect(getPayloadItem(app, "demo-title")?.style?.textAnchor).toBe("start");
  });

  it("edits paint style with color picker and theme token presets", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, '[data-item-id="demo-title"]').click();

    const colorInput = getInspectorField(app, "fill").querySelector<HTMLInputElement>(".style-color-input");
    const presetSelect = getInspectorField(app, "fill").querySelector<HTMLSelectElement>(".style-preset-select");

    if (!colorInput || !presetSelect) {
      throw new Error("paint controls missing");
    }

    colorInput.value = "#00ff00";
    colorInput.dispatchEvent(new Event("input"));
    expect(getPayloadItem(app, "demo-title")?.style?.fill).toBe("#00ff00");
    expect(app.querySelector('[data-id="demo-title"]')?.getAttribute("fill")).toBe("#00ff00");

    presetSelect.value = "var(--accent-color)";
    presetSelect.dispatchEvent(new Event("change"));

    expect(getPayloadItem(app, "demo-title")?.style?.fill).toBe("var(--accent-color)");
    expect(presetSelect.querySelector("option")?.textContent).toBe("Use theme colors...");
  });

  it("edits rect, circle, and polyline style fields", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, ".add-rect-button").click();
    getInspectorInput(app, "strokeWidth").value = "5";
    getInspectorInput(app, "strokeWidth").dispatchEvent(new Event("change"));
    expect(getPayloadItem(app, "rect-1")?.style?.strokeWidth).toBe(5);
    expect(app.querySelector('[data-id="rect-1"]')?.getAttribute("stroke-width")).toBe("5");

    getButton(app, '[data-item-id="demo-status-dot"]').click();
    getInspectorInput(app, "opacity").value = "50";
    getInspectorInput(app, "opacity").dispatchEvent(new Event("change"));
    expect(getPayloadItem(app, "demo-status-dot")?.style?.opacity).toBe(0.5);
    expect(app.querySelector('[data-id="demo-status-dot"]')?.getAttribute("opacity")).toBe("0.5");

    const opacitySlider = getInspectorField(app, "opacity").querySelector<HTMLInputElement>(".style-slider-input");

    if (!opacitySlider) {
      throw new Error("opacity slider missing");
    }

    opacitySlider.value = "25";
    opacitySlider.dispatchEvent(new Event("input"));
    expect(getInspectorInput(app, "opacity").value).toBe("25");
    expect(opacitySlider.parentElement).not.toBeNull();
    expect(getPayloadItem(app, "demo-status-dot")?.style?.opacity).toBe(0.25);
    expect(app.querySelector('[data-id="demo-status-dot"]')?.getAttribute("opacity")).toBe("0.25");

    getButton(app, '[data-item-id="demo-flow-line"]').click();
    getInspectorInput(app, "stroke").value = "#00ff00";
    getInspectorInput(app, "stroke").dispatchEvent(new Event("change"));
    expect(getPayloadItem(app, "demo-flow-line")?.style?.stroke).toBe("#00ff00");
    expect(app.querySelector('[data-id="demo-flow-line"]')?.getAttribute("stroke")).toBe("#00ff00");
  });

  it("removes style values when a style field is emptied", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, '[data-item-id="demo-title"]').click();
    getInspectorInput(app, "fill").value = "";
    getInspectorInput(app, "fill").dispatchEvent(new Event("change"));

    expect(getPayloadItem(app, "demo-title")?.style?.fill).toBeUndefined();
  });

  it("shows style validation errors without changing JSON", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, '[data-item-id="demo-title"]').click();
    const originalJson = getTextarea(app, ".json-input").value;
    getInspectorInput(app, "fontSize").value = "huge";
    getInspectorInput(app, "fontSize").dispatchEvent(new Event("change"));

    expect(getTextarea(app, ".json-input").value).toBe(originalJson);
    expect(app.querySelector<HTMLElement>(".inspector-status")?.textContent).toBe("fontSize must be a finite number");
  });

  it("adds a text item and selects it for editing", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, ".add-text-button").click();

    expect(getTextarea(app, ".json-input").value).toContain("\"id\": \"text-1\"");
    expect(getTextarea(app, ".json-input").value).toContain("\"text\": \"New text\"");
    expect(getButton(app, '[data-item-id="text-1"]').getAttribute("aria-pressed")).toBe("true");
    expect(app.querySelector("svg")?.textContent).toContain("New text");

    getInspectorInput(app, "text").value = "Added label";
    getInspectorInput(app, "text").dispatchEvent(new Event("change"));
    app.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));

    expect(getTextarea(app, ".json-input").value).toContain("\"text\": \"Added label\"");
    expect(getTextarea(app, ".json-input").value).toContain("\"x\": 211");
    expect(app.querySelector("svg")?.textContent).toContain("Added label");
    expect(getTextarea(app, ".payload-output").value.startsWith("hsc1.")).toBe(true);
  });

  it("undoes and redoes adding an item", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const undoButton = getButton(app, ".undo-button");
    const redoButton = getButton(app, ".redo-button");

    expect(undoButton.disabled).toBe(true);
    expect(redoButton.disabled).toBe(true);

    getButton(app, ".add-text-button").click();

    expect(getTextarea(app, ".json-input").value).toContain("\"id\": \"text-1\"");
    expect(undoButton.disabled).toBe(false);
    expect(redoButton.disabled).toBe(true);

    undoButton.click();

    expect(getTextarea(app, ".json-input").value).not.toContain("\"id\": \"text-1\"");
    expect(app.querySelector('[data-id="text-1"]')).toBeNull();
    expect(undoButton.disabled).toBe(true);
    expect(redoButton.disabled).toBe(false);

    redoButton.click();

    expect(getTextarea(app, ".json-input").value).toContain("\"id\": \"text-1\"");
    expect(app.querySelector('[data-id="text-1"]')).not.toBeNull();
    expect(getButton(app, '[data-item-id="text-1"]').getAttribute("aria-pressed")).toBe("true");
  });

  it("duplicates the selected item with a new id and offset", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, '[data-item-id="demo-title"]').click();
    getButton(app, ".duplicate-item-button").click();

    expect(getTextarea(app, ".json-input").value).toContain("\"id\": \"demo-title-copy\"");
    expect(getTextarea(app, ".json-input").value).toContain("\"x\": 26");
    expect(getTextarea(app, ".json-input").value).toContain("\"y\": 38");
    expect(getButton(app, '[data-item-id="demo-title-copy"]').getAttribute("aria-pressed")).toBe("true");
    expect(app.querySelector('[data-id="demo-title-copy"]')).not.toBeNull();
    expect(getTextarea(app, ".payload-output").value.startsWith("hsc1.")).toBe(true);
  });

  it("undoes and redoes duplicating an item", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, '[data-item-id="demo-title"]').click();
    getButton(app, ".duplicate-item-button").click();

    expect(getTextarea(app, ".json-input").value).toContain("\"id\": \"demo-title-copy\"");

    getButton(app, ".undo-button").click();

    expect(getTextarea(app, ".json-input").value).not.toContain("\"id\": \"demo-title-copy\"");

    getButton(app, ".redo-button").click();

    expect(getTextarea(app, ".json-input").value).toContain("\"id\": \"demo-title-copy\"");
    expect(getButton(app, '[data-item-id="demo-title-copy"]').getAttribute("aria-pressed")).toBe("true");
  });

  it("deletes the selected item and supports undo and redo", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, '[data-item-id="demo-title"]').click();
    getButton(app, ".delete-item-button").click();

    expect(getTextarea(app, ".json-input").value).not.toContain("\"id\": \"demo-title\"");
    expect(app.querySelector('[data-id="demo-title"]')).toBeNull();
    expect(getButton(app, '[data-item-id="demo-flow-line"]').getAttribute("aria-pressed")).toBe("true");

    getButton(app, ".undo-button").click();

    expect(getTextarea(app, ".json-input").value).toContain("\"id\": \"demo-title\"");
    expect(getButton(app, '[data-item-id="demo-title"]').getAttribute("aria-pressed")).toBe("true");

    getButton(app, ".redo-button").click();

    expect(getTextarea(app, ".json-input").value).not.toContain("\"id\": \"demo-title\"");
  });

  it("deletes the selected item with Delete or Backspace shortcuts", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, '[data-item-id="demo-title"]').click();
    app.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete", bubbles: true }));

    expect(getTextarea(app, ".json-input").value).not.toContain("\"id\": \"demo-title\"");

    getButton(app, ".undo-button").click();
    app.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", bubbles: true }));

    expect(getTextarea(app, ".json-input").value).not.toContain("\"id\": \"demo-title\"");
  });

  it("adds rect and circle items with visible defaults", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, ".add-rect-button").click();
    expect(getTextarea(app, ".json-input").value).toContain("\"id\": \"rect-1\"");
    expect(app.querySelector('[data-id="rect-1"]')).not.toBeNull();

    getButton(app, ".add-circle-button").click();
    expect(getTextarea(app, ".json-input").value).toContain("\"id\": \"circle-1\"");
    expect(getButton(app, '[data-item-id="circle-1"]').getAttribute("aria-pressed")).toBe("true");
    expect(app.querySelector('[data-id="circle-1"]')).not.toBeNull();
  });

  it("does not render nudge buttons in the inspector", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const titleButton = getButton(app, '[data-item-id="demo-title"]');

    titleButton.click();

    expect(app.querySelector(".nudge-button")).toBeNull();
  });

  it("nudges a selected positioned item with arrow keys", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const titleButton = getButton(app, '[data-item-id="demo-title"]');

    titleButton.click();
    app.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    app.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", shiftKey: true, bubbles: true }));
    const editedText = [...app.querySelectorAll("text")].find((element) => element.textContent === "Schematic Demo");

    expect(getTextarea(app, ".json-input").value).toContain("\"x\": 15");
    expect(getTextarea(app, ".json-input").value).toContain("\"y\": 18");
    expect(editedText?.getAttribute("x")).toBe("15");
    expect(editedText?.getAttribute("y")).toBe("18");
  });

  it("drags a selected preview item and updates JSON, preview, and export", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const svg = app.querySelector("svg");
    const title = [...app.querySelectorAll("text")].find((element) => element.textContent === "Schematic Demo");

    if (!svg || !title) {
      throw new Error("draggable preview item missing");
    }

    setSvgBounds(svg, { left: 0, top: 0, width: 420, height: 180 });
    title.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 16, clientY: 28, bubbles: true }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 21, clientY: 33 }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 36, clientY: 43 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    const movedTitle = [...app.querySelectorAll("text")].find((element) => element.textContent === "Schematic Demo");

    expect(getTextarea(app, ".json-input").value).toContain("\"x\": 40");
    expect(getTextarea(app, ".json-input").value).toContain("\"y\": 40");
    expect(movedTitle?.getAttribute("x")).toBe("40");
    expect(movedTitle?.getAttribute("y")).toBe("40");
    expect(getButton(app, '[data-item-id="demo-title"]').getAttribute("aria-pressed")).toBe("true");
    expect(getTextarea(app, ".payload-output").value.startsWith("hsc1.")).toBe(true);
  });

  it("undoes and redoes dragging a preview item", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const svg = app.querySelector("svg");
    const title = [...app.querySelectorAll("text")].find((element) => element.textContent === "Schematic Demo");

    if (!svg || !title) {
      throw new Error("draggable preview item missing");
    }

    setSvgBounds(svg, { left: 0, top: 0, width: 420, height: 180 });
    title.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 16, clientY: 28, bubbles: true }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 36, clientY: 43 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    expect(getTextarea(app, ".json-input").value).toContain("\"x\": 40");
    expect(getTextarea(app, ".json-input").value).toContain("\"y\": 40");

    app.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }));

    expect(getTextarea(app, ".json-input").value).toContain("\"x\": 16");
    expect(getTextarea(app, ".json-input").value).toContain("\"y\": 28");

    app.dispatchEvent(new KeyboardEvent("keydown", { key: "Z", ctrlKey: true, shiftKey: true, bubbles: true }));

    expect(getTextarea(app, ".json-input").value).toContain("\"x\": 40");
    expect(getTextarea(app, ".json-input").value).toContain("\"y\": 40");
  });

  it("toggles the preview grid overlay", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const gridButton = getButton(app, ".toggle-grid-button");
    const gridSizeInput = getInput(app, ".grid-size-input");

    expect(gridButton.getAttribute("aria-pressed")).toBe("true");
    expect(app.querySelector('[data-editor-grid="true"]')?.getAttribute("data-grid-size")).toBe("10");

    gridSizeInput.value = "20";
    gridSizeInput.dispatchEvent(new Event("change"));
    expect(app.querySelector('[data-editor-grid="true"]')?.getAttribute("data-grid-size")).toBe("20");

    gridButton.click();

    expect(gridButton.getAttribute("aria-pressed")).toBe("false");
    expect(gridButton.textContent).toBe("Grid Off");
    expect(app.querySelector('[data-editor-grid="true"]')).toBeNull();
  });

  it("keeps the previous grid size when grid size input is invalid", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const gridSizeInput = getInput(app, ".grid-size-input");

    gridSizeInput.value = "-1";
    gridSizeInput.dispatchEvent(new Event("change"));

    expect(gridSizeInput.value).toBe("10");
    expect(gridSizeInput.validationMessage).toBe("Grid size must be a positive number");
    expect(app.querySelector('[data-editor-grid="true"]')?.getAttribute("data-grid-size")).toBe("10");
  });

  it("uses custom grid size when snapping dragged items", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const gridSizeInput = getInput(app, ".grid-size-input");

    gridSizeInput.value = "20";
    gridSizeInput.dispatchEvent(new Event("change"));

    const svg = app.querySelector("svg");
    const title = [...app.querySelectorAll("text")].find((element) => element.textContent === "Schematic Demo");

    if (!svg || !title) {
      throw new Error("draggable preview item missing");
    }

    setSvgBounds(svg, { left: 0, top: 0, width: 420, height: 180 });
    title.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 16, clientY: 28, bubbles: true }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 47, clientY: 47 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    const movedTitle = [...app.querySelectorAll("text")].find((element) => element.textContent === "Schematic Demo");

    expect(getTextarea(app, ".json-input").value).toContain("\"x\": 40");
    expect(getTextarea(app, ".json-input").value).toContain("\"y\": 40");
    expect(movedTitle?.getAttribute("x")).toBe("40");
    expect(movedTitle?.getAttribute("y")).toBe("40");
  });

  it("temporarily disables snap while holding Shift during item drag", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const gridSizeInput = getInput(app, ".grid-size-input");

    gridSizeInput.value = "20";
    gridSizeInput.dispatchEvent(new Event("change"));

    const svg = app.querySelector("svg");
    const title = [...app.querySelectorAll("text")].find((element) => element.textContent === "Schematic Demo");

    if (!svg || !title) {
      throw new Error("draggable preview item missing");
    }

    setSvgBounds(svg, { left: 0, top: 0, width: 420, height: 180 });
    title.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 16, clientY: 28, bubbles: true }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 47, clientY: 47, shiftKey: true }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    expect(getPositionedPayloadItem(app, "demo-title")?.x).toBe(47);
    expect(getPositionedPayloadItem(app, "demo-title")?.y).toBe(47);
  });

  it("toggles snap independently from grid visibility", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const gridButton = getButton(app, ".toggle-grid-button");
    const snapButton = getButton(app, ".toggle-snap-button");
    const gridSizeInput = getInput(app, ".grid-size-input");
    const svg = app.querySelector("svg");
    const title = [...app.querySelectorAll("text")].find((element) => element.textContent === "Schematic Demo");

    if (!svg || !title) {
      throw new Error("draggable preview item missing");
    }

    gridSizeInput.value = "20";
    gridSizeInput.dispatchEvent(new Event("change"));
    gridButton.click();

    expect(gridButton.getAttribute("aria-pressed")).toBe("false");
    expect(snapButton.getAttribute("aria-pressed")).toBe("true");

    setSvgBounds(svg, { left: 0, top: 0, width: 420, height: 180 });
    title.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 16, clientY: 28, bubbles: true }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 47, clientY: 47 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    expect(getPositionedPayloadItem(app, "demo-title")?.x).toBe(40);
    expect(getPositionedPayloadItem(app, "demo-title")?.y).toBe(40);

    snapButton.click();
    expect(snapButton.getAttribute("aria-pressed")).toBe("false");

    const movedTitle = [...app.querySelectorAll("text")].find((element) => element.textContent === "Schematic Demo");

    if (!movedTitle?.ownerSVGElement) {
      throw new Error("moved preview item missing");
    }

    setSvgBounds(movedTitle.ownerSVGElement, { left: 0, top: 0, width: 420, height: 180 });
    movedTitle?.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 40, clientY: 40, bubbles: true }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 47, clientY: 47 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    expect(getPositionedPayloadItem(app, "demo-title")?.x).toBe(47);
    expect(getPositionedPayloadItem(app, "demo-title")?.y).toBe(47);
  });

  it("pans and resets the preview viewBox", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const svg = app.querySelector("svg");

    if (!svg) {
      throw new Error("preview svg missing");
    }

    expect(svg.getAttribute("viewBox")).toBe("0 0 420 180");
    expect(app.querySelector(".zoom-in-button")).toBeNull();
    expect(app.querySelector(".zoom-out-button")).toBeNull();
    expect(getButton(app, ".select-tool-button").textContent).toBe("↖");
    expect(getButton(app, ".pan-tool-button").textContent).toBe("🤚");

    getButton(app, ".pan-tool-button").click();
    expect(getButton(app, ".pan-tool-button").getAttribute("aria-pressed")).toBe("true");

    setSvgBounds(svg, { left: 0, top: 0, width: 420, height: 180 });
    svg.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 100, clientY: 80, bubbles: true }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 120, clientY: 110 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    expect(svg.getAttribute("viewBox")).toBe("-20 -30 420 180");

    getButton(app, ".reset-view-button").click();
    expect(svg.getAttribute("viewBox")).toBe("0 0 420 180");
  });

  it("zooms around the pointer with the mouse wheel", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const svg = app.querySelector("svg");

    if (!svg) {
      throw new Error("preview svg missing");
    }

    setSvgBounds(svg, { left: 0, top: 0, width: 420, height: 180 });
    const wheelEvent = new MouseEvent("wheel", {
      clientX: 210,
      clientY: 90,
      bubbles: true,
      cancelable: true
    });
    Object.defineProperty(wheelEvent, "deltaY", { value: -100 });
    svg.dispatchEvent(wheelEvent);

    expect(svg.getAttribute("viewBox")).toBe("21 9 378 162");
  });

  it("supports ctrl multi-select and box-select in pointer mode", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const title = app.querySelector('[data-id="demo-title"]');
    const temperature = app.querySelector('[data-id="demo-temperature"]');

    if (!title || !temperature) {
      throw new Error("preview selection targets missing");
    }

    title.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    temperature.dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: true }));

    expect(getButton(app, '[data-item-id="demo-title"]').getAttribute("aria-pressed")).toBe("true");
    expect(getButton(app, '[data-item-id="demo-temperature"]').getAttribute("aria-pressed")).toBe("true");
    expect(app.querySelector<HTMLElement>(".inspector-status")?.textContent).toBe("2 items selected");

    const boxSelectSvg = app.querySelector("svg");

    if (!boxSelectSvg) {
      throw new Error("preview svg missing");
    }

    setSvgBounds(boxSelectSvg, { left: 0, top: 0, width: 420, height: 180 });
    boxSelectSvg.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 100, clientY: 50, bubbles: true }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 280, clientY: 150 }));

    expect(app.querySelector("[data-editor-selection-rectangle]")).not.toBeNull();

    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    expect(getButton(app, '[data-item-id="demo-component-a"]').getAttribute("aria-pressed")).toBe("true");
    expect(getButton(app, '[data-item-id="demo-component-b"]').getAttribute("aria-pressed")).toBe("true");
    expect(app.querySelector("[data-editor-selection-rectangle]")).toBeNull();

    boxSelectSvg.dispatchEvent(new MouseEvent("click", { clientX: 20, clientY: 20, bubbles: true }));

    expect(getButton(app, '[data-item-id="demo-component-a"]').getAttribute("aria-pressed")).toBe("false");
    expect(getButton(app, '[data-item-id="demo-component-b"]').getAttribute("aria-pressed")).toBe("false");
  });

  it("moves, duplicates, deletes, and restores multiple selected items", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const snapButton = getButton(app, ".toggle-snap-button");

    snapButton.click();
    clickPreviewItem(app, "demo-title");
    clickPreviewItem(app, "demo-temperature", { ctrlKey: true });

    expect(app.querySelector<HTMLElement>(".inspector-status")?.textContent).toBe("2 items selected");

    app.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    app.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", shiftKey: true, bubbles: true }));

    expect(getPositionedPayloadItem(app, "demo-title")).toMatchObject({ x: 17, y: 38 });
    expect(getPositionedPayloadItem(app, "demo-temperature")).toMatchObject({ x: 49, y: 156 });

    const svg = app.querySelector("svg");
    const title = app.querySelector('[data-id="demo-title"]');

    if (!svg || !title) {
      throw new Error("multi-drag target missing");
    }

    setSvgBounds(svg, { left: 0, top: 0, width: 420, height: 180 });
    title.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 17, clientY: 38, bubbles: true }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 37, clientY: 53 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    expect(getPositionedPayloadItem(app, "demo-title")).toMatchObject({ x: 37, y: 53 });
    expect(getPositionedPayloadItem(app, "demo-temperature")).toMatchObject({ x: 69, y: 171 });

    getButton(app, ".duplicate-item-button").click();

    expect(getPositionedPayloadItem(app, "demo-title-copy")).toMatchObject({ x: 47, y: 63 });
    expect(getPositionedPayloadItem(app, "demo-temperature-copy")).toMatchObject({ x: 79, y: 181 });
    expect(getButton(app, '[data-item-id="demo-title-copy"]').getAttribute("aria-pressed")).toBe("true");
    expect(getButton(app, '[data-item-id="demo-temperature-copy"]').getAttribute("aria-pressed")).toBe("true");

    getButton(app, ".delete-item-button").click();

    expect(getPositionedPayloadItem(app, "demo-title-copy")).toBeUndefined();
    expect(getPositionedPayloadItem(app, "demo-temperature-copy")).toBeUndefined();

    app.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }));

    expect(getPositionedPayloadItem(app, "demo-title-copy")).toMatchObject({ x: 47, y: 63 });
    expect(getPositionedPayloadItem(app, "demo-temperature-copy")).toMatchObject({ x: 79, y: 181 });

    app.dispatchEvent(new KeyboardEvent("keydown", { key: "Z", ctrlKey: true, shiftKey: true, bubbles: true }));

    expect(getPositionedPayloadItem(app, "demo-title-copy")).toBeUndefined();
    expect(getPositionedPayloadItem(app, "demo-temperature-copy")).toBeUndefined();
    expect(getTextarea(app, ".payload-output").value.startsWith("hsc1.")).toBe(true);
  });

  it("keeps item dragging in schema coordinates after zooming", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const snapButton = getButton(app, ".toggle-snap-button");
    const svg = app.querySelector("svg");
    const title = [...app.querySelectorAll("text")].find((element) => element.textContent === "Schematic Demo");

    if (!svg || !title) {
      throw new Error("draggable preview item missing");
    }

    snapButton.click();
    setSvgBounds(svg, { left: 0, top: 0, width: 420, height: 180 });
    const wheelEvent = new MouseEvent("wheel", {
      clientX: 210,
      clientY: 90,
      bubbles: true,
      cancelable: true
    });
    Object.defineProperty(wheelEvent, "deltaY", { value: 100 });
    svg.dispatchEvent(wheelEvent);

    const viewBox = { x: -21, y: -9, width: 462, height: 198 };
    const startClientX = ((16 - viewBox.x) / viewBox.width) * 420;
    const startClientY = ((28 - viewBox.y) / viewBox.height) * 180;
    const moveClientX = startClientX + (20 / viewBox.width) * 420;
    const moveClientY = startClientY + (15 / viewBox.height) * 180;

    title.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: startClientX, clientY: startClientY, bubbles: true }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: moveClientX, clientY: moveClientY }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    expect(getPositionedPayloadItem(app, "demo-title")?.x).toBeCloseTo(36);
    expect(getPositionedPayloadItem(app, "demo-title")?.y).toBeCloseTo(43);
  });

  it("keeps preview interactions aligned when the preview is taller than the schematic", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const snapButton = getButton(app, ".toggle-snap-button");
    const svg = app.querySelector("svg");
    const title = [...app.querySelectorAll("text")].find((element) => element.textContent === "Schematic Demo");

    if (!svg || !title) {
      throw new Error("preview item missing");
    }

    snapButton.click();
    setSvgBounds(svg, { left: 0, top: 0, width: 420, height: 720 });
    title.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 16, clientY: 298, bubbles: true }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 36, clientY: 313 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    expect(getPositionedPayloadItem(app, "demo-title")?.x).toBeCloseTo(36);
    expect(getPositionedPayloadItem(app, "demo-title")?.y).toBeCloseTo(43);

    const selectionSvg = app.querySelector("svg");

    if (!selectionSvg) {
      throw new Error("preview svg missing after drag");
    }

    setSvgBounds(selectionSvg, { left: 0, top: 0, width: 420, height: 720 });
    selectionSvg.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 100, clientY: 320, bubbles: true }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 280, clientY: 420 }));

    const selectionRect = app.querySelector("[data-editor-selection-rectangle]");
    expect(selectionRect?.getAttribute("x")).toBe("100");
    expect(selectionRect?.getAttribute("y")).toBe("50");
    expect(selectionRect?.getAttribute("width")).toBe("180");
    expect(selectionRect?.getAttribute("height")).toBe("100");

    documentRef.dispatchEvent(new MouseEvent("mouseup", { clientX: 280, clientY: 420 }));

    snapButton.click();
    drawTwoPointPolyline(app);
    const tallSvg = app.querySelector("svg");
    const handle = app.querySelector<SVGCircleElement>('.editor-polyline-handle-hitbox[data-polyline-handle="polyline-1"][data-point-index="1"]');

    if (!tallSvg || !handle) {
      throw new Error("polyline handle missing");
    }

    setSvgBounds(tallSvg, { left: 0, top: 0, width: 420, height: 720 });
    handle.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 60, clientY: 310, bubbles: true }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 82, clientY: 344 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    expect(getPolylinePoints(app, "polyline-1")[1]).toEqual({ x: 80, y: 70 });
  });

  it("draws a snapped polyline in the preview and selects it", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, ".draw-polyline-button").click();
    expect(getButton(app, ".draw-polyline-button").getAttribute("aria-pressed")).toBe("true");
    expect(getButton(app, ".finish-polyline-button").hidden).toBe(false);

    clickPreviewPoint(app, 13, 14);
    clickPreviewPoint(app, 56, 44);
    getButton(app, ".finish-polyline-button").click();

    expect(getTextarea(app, ".json-input").value).toContain("\"id\": \"polyline-1\"");
    expect(getTextarea(app, ".json-input").value).toContain("\"x\": 10");
    expect(getTextarea(app, ".json-input").value).toContain("\"y\": 10");
    expect(getTextarea(app, ".json-input").value).toContain("\"x\": 60");
    expect(getTextarea(app, ".json-input").value).toContain("\"y\": 40");
    expect(app.querySelector('[data-id="polyline-1"]')).not.toBeNull();
    expect(getButton(app, '[data-item-id="polyline-1"]').getAttribute("aria-pressed")).toBe("true");
    expect(getTextarea(app, ".payload-output").value.startsWith("hsc1.")).toBe(true);
    expect(getButton(app, ".draw-polyline-button").getAttribute("aria-pressed")).toBe("false");
  });

  it("shows a rubber-band preview while drawing a polyline", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, ".draw-polyline-button").click();
    clickPreviewPoint(app, 13, 14);
    movePreviewPointer(app, 56, 44);

    const rubberBand = app.querySelector<SVGLineElement>("[data-editor-rubber-band]");

    expect(rubberBand).not.toBeNull();
    expect(rubberBand?.getAttribute("x1")).toBe("10");
    expect(rubberBand?.getAttribute("y1")).toBe("10");
    expect(rubberBand?.getAttribute("x2")).toBe("60");
    expect(rubberBand?.getAttribute("y2")).toBe("40");
    expect(getTextarea(app, ".json-input").value).not.toContain("\"x\": 60");

    clickPreviewPoint(app, 56, 44);
    getButton(app, ".finish-polyline-button").click();

    expect(app.querySelector("[data-editor-rubber-band]")).toBeNull();
  });

  it("locks polyline drawing to horizontal or vertical segments while holding Shift", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, ".draw-polyline-button").click();
    clickPreviewPoint(app, 13, 14);
    movePreviewPointer(app, 56, 44, { shiftKey: true });

    const rubberBand = app.querySelector<SVGLineElement>("[data-editor-rubber-band]");

    expect(rubberBand?.getAttribute("x1")).toBe("10");
    expect(rubberBand?.getAttribute("y1")).toBe("10");
    expect(rubberBand?.getAttribute("x2")).toBe("60");
    expect(rubberBand?.getAttribute("y2")).toBe("10");

    clickPreviewPoint(app, 56, 44, { shiftKey: true });
    getButton(app, ".finish-polyline-button").click();

    expect(getTextarea(app, ".json-input").value).toContain("\"x\": 60");
    expect(getTextarea(app, ".json-input").value).toContain("\"y\": 10");
    expect(getTextarea(app, ".json-input").value).not.toContain("\"y\": 40");
  });

  it("shows handles for a selected polyline and drags one point", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    drawTwoPointPolyline(app);

    const handle = app.querySelector<SVGCircleElement>('.editor-polyline-handle-hitbox[data-polyline-handle="polyline-1"][data-point-index="1"]');

    if (!handle) {
      throw new Error("polyline handle missing");
    }

    const svg = app.querySelector("svg");

    if (!svg) {
      throw new Error("preview svg missing");
    }

    setSvgBounds(svg, { left: 0, top: 0, width: 420, height: 180 });
    handle.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 60, clientY: 40, bubbles: true }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 82, clientY: 74 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    const movedHandle = app.querySelector<SVGCircleElement>('.editor-polyline-handle-hitbox[data-polyline-handle="polyline-1"][data-point-index="1"]');
    const visibleDot = app.querySelector<SVGCircleElement>('.editor-polyline-handle-dot[data-polyline-handle="polyline-1"][data-point-index="1"]');

    expect(getTextarea(app, ".json-input").value).toContain("\"x\": 80");
    expect(getTextarea(app, ".json-input").value).toContain("\"y\": 70");
    expect(movedHandle?.getAttribute("cx")).toBe("80");
    expect(movedHandle?.getAttribute("cy")).toBe("70");
    expect(movedHandle?.getAttribute("r")).toBe("5");
    expect(visibleDot?.getAttribute("r")).toBe("1.5");
    expect(getTextarea(app, ".payload-output").value.startsWith("hsc1.")).toBe(true);
  });

  it("shows and hides polyline handles immediately when selection changes", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    drawTwoPointPolyline(app);
    getButton(app, '[data-item-id="demo-title"]').click();

    expect(app.querySelector("[data-editor-polyline-handles]")).toBeNull();

    app.querySelector('[data-id="polyline-1"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(app.querySelector('[data-polyline-handle="polyline-1"]')).not.toBeNull();

    app.querySelector("svg")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(app.querySelector("[data-editor-polyline-handles]")).toBeNull();

    app.querySelector('[data-id="polyline-1"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    app.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(app.querySelector("[data-editor-polyline-handles]")).toBeNull();
  });

  it("undoes and redoes polyline point edits", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    drawTwoPointPolyline(app);

    const handle = app.querySelector<SVGCircleElement>('.editor-polyline-handle-hitbox[data-polyline-handle="polyline-1"][data-point-index="1"]');
    const svg = app.querySelector("svg");

    if (!handle || !svg) {
      throw new Error("polyline handle missing");
    }

    setSvgBounds(svg, { left: 0, top: 0, width: 420, height: 180 });
    handle.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 60, clientY: 40, bubbles: true }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 82, clientY: 74 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    expect(getPolylinePoints(app, "polyline-1")[1]).toEqual({ x: 80, y: 70 });

    getButton(app, ".undo-button").click();

    expect(getPolylinePoints(app, "polyline-1")[1]).toEqual({ x: 60, y: 40 });

    getButton(app, ".redo-button").click();

    expect(getPolylinePoints(app, "polyline-1")[1]).toEqual({ x: 80, y: 70 });
  });

  it("locks dragged polyline points horizontally or vertically while holding Shift", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    drawTwoPointPolyline(app);

    const handle = app.querySelector<SVGCircleElement>('.editor-polyline-handle-hitbox[data-polyline-handle="polyline-1"][data-point-index="1"]');
    const svg = app.querySelector("svg");

    if (!handle || !svg) {
      throw new Error("polyline handle missing");
    }

    setSvgBounds(svg, { left: 0, top: 0, width: 420, height: 180 });
    handle.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 60, clientY: 40, bubbles: true }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 82, clientY: 74, shiftKey: true }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    const movedHandle = app.querySelector<SVGCircleElement>('.editor-polyline-handle-hitbox[data-polyline-handle="polyline-1"][data-point-index="1"]');

    expect(getTextarea(app, ".json-input").value).toContain("\"x\": 82");
    expect(getTextarea(app, ".json-input").value).toContain("\"y\": 10");
    expect(movedHandle?.getAttribute("cx")).toBe("82");
    expect(movedHandle?.getAttribute("cy")).toBe("10");
  });

  it("adds and deletes polyline points from the context menu", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    drawTwoPointPolyline(app);
    openPolylineContextMenu(app, 30, 20);
    getButton(app, ".add-polyline-point-button").click();

    expect(getPolylinePoints(app, "polyline-1")).toHaveLength(3);
    expect(getTextarea(app, ".json-input").value).toContain("\"x\": 30");
    expect(getTextarea(app, ".json-input").value).toContain("\"y\": 20");

    openPolylineContextMenu(app, 30, 20);
    getButton(app, ".delete-polyline-point-button").click();

    expect(getPolylinePoints(app, "polyline-1")).toHaveLength(2);

    openPolylineContextMenu(app, 10, 10);
    expect(getButton(app, ".delete-polyline-point-button").disabled).toBe(true);
  });

  it("opens the custom context menu when right-clicking a polyline handle", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    drawTwoPointPolyline(app);
    openPolylineHandleContextMenu(app, 1);

    expect(app.querySelector<HTMLElement>(".polyline-context-menu")?.hidden).toBe(false);
    expect(getButton(app, ".delete-polyline-point-button").disabled).toBe(true);
  });

  it("opens layer controls when right-clicking a preview item", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    openItemContextMenu(app, "demo-title");

    expect(app.querySelector<HTMLElement>(".polyline-context-menu")?.hidden).toBe(false);
    expect(getButton(app, ".bring-forward-button").textContent).toBe("Bring forward");
    expect(getButton(app, ".send-backward-button").textContent).toBe("Send backward");
    expect(getButton(app, ".bring-to-front-button").textContent).toBe("Bring to front");
    expect(getButton(app, ".send-to-back-button").textContent).toBe("Send to back");
    expect(app.querySelector<HTMLElement>(".polyline-context-menu")?.dataset.mode).toBe("item");
    expect(getButton(app, '[data-item-id="demo-title"]').getAttribute("aria-pressed")).toBe("true");
  });

  it("adds items from the empty preview context menu", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    openEmptyPreviewContextMenu(app, 100, 80);

    expect(app.querySelector<HTMLElement>(".polyline-context-menu")?.dataset.mode).toBe("empty");

    getButton(app, ".add-rect-context-button").click();

    expect(getPayloadItem(app, "rect-1")).toMatchObject({ id: "rect-1" });
    expect(getPositionedPayloadItem(app, "rect-1")).toMatchObject({ x: 68, y: 60 });

    openEmptyPreviewContextMenu(app, 140, 90);
    getButton(app, ".add-polyline-context-button").click();

    expect(getPolylinePoints(app, "polyline-1")).toEqual([{ x: 140, y: 90 }, { x: 200, y: 90 }]);
    expect(getTextarea(app, ".payload-output").value.startsWith("hsc1.")).toBe(true);
  });

  it("aligns, mirrors, duplicates, and deletes from the item context menu", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    clickPreviewItem(app, "demo-title");
    clickPreviewItem(app, "demo-temperature", { ctrlKey: true });
    openItemContextMenu(app, "demo-title");
    getButton(app, ".align-right-button").click();

    expect(getPositionedPayloadItem(app, "demo-title")?.x).toBe(48);
    expect(getPositionedPayloadItem(app, "demo-temperature")?.x).toBe(48);

    getButton(app, ".undo-button").click();
    openItemContextMenu(app, "demo-title");
    getButton(app, ".mirror-horizontal-button").click();

    expect(getPositionedPayloadItem(app, "demo-title")?.x).toBe(48);
    expect(getPositionedPayloadItem(app, "demo-temperature")?.x).toBe(16);

    openItemContextMenu(app, "demo-title");
    getButton(app, ".context-duplicate-button").click();

    expect(getPositionedPayloadItem(app, "demo-title-copy")).toMatchObject({ x: 58, y: 38 });
    expect(getPositionedPayloadItem(app, "demo-temperature-copy")).toMatchObject({ x: 26, y: 156 });

    openItemContextMenu(app, "demo-title-copy");
    getButton(app, ".context-delete-button").click();

    expect(getPositionedPayloadItem(app, "demo-title-copy")).toBeUndefined();
    expect(getPositionedPayloadItem(app, "demo-temperature-copy")).toBeUndefined();
  });

  it("changes item layer from the context menu and supports undo and redo", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    openItemContextMenu(app, "demo-title");
    getButton(app, ".bring-forward-button").click();

    expect(getPayloadItem(app, "demo-title")?.layer).toBe(621);
    expect(getInspectorInput(app, "layer").value).toBe("621");
    expect(getTextarea(app, ".payload-output").value.startsWith("hsc1.")).toBe(true);

    getButton(app, ".undo-button").click();

    expect(getPayloadItem(app, "demo-title")?.layer).toBe(600);

    getButton(app, ".redo-button").click();

    expect(getPayloadItem(app, "demo-title")?.layer).toBe(621);
  });

  it("supports front, back, forward, and backward layer actions", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    openItemContextMenu(app, "demo-title");
    getButton(app, ".bring-to-front-button").click();
    expect(getPayloadItem(app, "demo-title")?.layer).toBe(721);

    openItemContextMenu(app, "demo-title");
    getButton(app, ".send-to-back-button").click();
    expect(getPayloadItem(app, "demo-title")?.layer).toBe(119);

    openItemContextMenu(app, "demo-component-a");
    getButton(app, ".bring-forward-button").click();
    expect(getPayloadItem(app, "demo-component-a")?.layer).toBe(521);

    openItemContextMenu(app, "demo-component-a");
    getButton(app, ".send-backward-button").click();
    expect(getPayloadItem(app, "demo-component-a")?.layer).toBe(519);
  });

  it("cancels a draft polyline with Escape", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, ".draw-polyline-button").click();
    clickPreviewPoint(app, 20, 20);
    app.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(getTextarea(app, ".json-input").value).not.toContain("\"id\": \"polyline-1\"");
    expect(app.querySelector('[data-id="polyline-1"]')).toBeNull();
    expect(getButton(app, ".draw-polyline-button").getAttribute("aria-pressed")).toBe("false");
    expect(app.querySelector<HTMLElement>(".inspector-status")?.textContent).toBe("Polyline drawing cancelled");
  });

  it("opens and closes import, SVG import, export, and theme side panels from the top toolbar", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const panel = app.querySelector<HTMLElement>(".transfer-panel");
    const importSection = app.querySelector<HTMLElement>(".import-section");
    const svgImportSection = app.querySelector<HTMLElement>(".svg-import-section");
    const themeSection = app.querySelector<HTMLElement>(".theme-section");
    const exportSection = app.querySelector<HTMLElement>(".export-section");

    if (!panel || !importSection || !svgImportSection || !themeSection || !exportSection) {
      throw new Error("transfer panel missing");
    }

    expect(panel.hidden).toBe(true);

    getButton(app, ".open-import-button").click();
    expect(panel.hidden).toBe(false);
    expect(panel.dataset.mode).toBe("import");
    expect(importSection.hidden).toBe(false);
    expect(svgImportSection.hidden).toBe(true);
    expect(themeSection.hidden).toBe(true);
    expect(exportSection.hidden).toBe(true);

    getButton(app, ".open-svg-import-button").click();
    expect(panel.dataset.mode).toBe("svg");
    expect(importSection.hidden).toBe(true);
    expect(svgImportSection.hidden).toBe(false);
    expect(themeSection.hidden).toBe(true);
    expect(exportSection.hidden).toBe(true);

    getButton(app, ".open-export-button").click();
    expect(panel.dataset.mode).toBe("export");
    expect(importSection.hidden).toBe(true);
    expect(svgImportSection.hidden).toBe(true);
    expect(themeSection.hidden).toBe(true);
    expect(exportSection.hidden).toBe(false);

    getButton(app, ".open-theme-button").click();
    expect(panel.dataset.mode).toBe("theme");
    expect(importSection.hidden).toBe(true);
    expect(svgImportSection.hidden).toBe(true);
    expect(themeSection.hidden).toBe(false);
    expect(exportSection.hidden).toBe(true);

    getButton(app, ".transfer-panel-close").click();
    expect(panel.hidden).toBe(true);
  });

  it("resizes the left editor panel with the resize handle", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const handle = app.querySelector<HTMLElement>(".editor-resize-handle");

    if (!handle) {
      throw new Error("resize handle missing");
    }

    handle.dispatchEvent(new MouseEvent("mousedown", { clientX: 420, bubbles: true }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 560 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    expect(app.style.getPropertyValue("--editor-left-width")).toBe("560px");
  });

  it("keeps the copy button with the export payload field", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const exportSection = app.querySelector<HTMLElement>(".export-section");

    expect(exportSection?.querySelector(".copy-button")).not.toBeNull();
    expect(exportSection?.querySelector(".payload-output")).not.toBeNull();
  });

  it("shows an inspector error for invalid numeric values without changing JSON", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const titleButton = getButton(app, '[data-item-id="demo-title"]');

    titleButton.click();
    const originalJson = getTextarea(app, ".json-input").value;
    getInspectorInput(app, "x").value = "not-a-number";
    getInspectorInput(app, "x").dispatchEvent(new Event("change"));

    expect(getTextarea(app, ".json-input").value).toBe(originalJson);
    expect(app.querySelector<HTMLElement>(".inspector-status")?.textContent).toBe("x must be a finite number");
  });

  it("shows an error for invalid JSON", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const jsonInput = app.querySelector<HTMLTextAreaElement>(".json-input");

    if (!jsonInput) {
      throw new Error("json input missing");
    }

    jsonInput.value = "{";
    jsonInput.dispatchEvent(new Event("input"));

    expect(app.querySelector<HTMLElement>(".status")?.textContent).toContain("JSON error:");
    expect(app.querySelector("svg")).toBeNull();
    expect(app.querySelector<HTMLTextAreaElement>(".payload-output")?.value).toBe("");
  });

  it("shows schema validation errors", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const jsonInput = app.querySelector<HTMLTextAreaElement>(".json-input");

    if (!jsonInput) {
      throw new Error("json input missing");
    }

    jsonInput.value = JSON.stringify({
      schemaVersion: 1,
      items: []
    });
    jsonInput.dispatchEvent(new Event("input"));

    expect(app.querySelector<HTMLElement>(".status")?.textContent).toContain("Schema error:");
    expect(app.querySelector<HTMLElement>(".status")?.textContent).toContain("- viewport must be an object");
    expect(app.querySelector("svg")).toBeNull();
  });

  it("formats valid JSON", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const jsonInput = getTextarea(app, ".json-input");
    const formatButton = getButton(app, ".format-button");

    jsonInput.value = JSON.stringify(getDemoPayload());
    formatButton.click();

    expect(jsonInput.value).toBe(formatPayloadJson());
    expect(app.querySelector<HTMLElement>(".status")?.textContent).toBe("Valid payload");
  });

  it("does not overwrite invalid JSON when formatting", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const jsonInput = getTextarea(app, ".json-input");
    const formatButton = getButton(app, ".format-button");

    jsonInput.value = "{";
    formatButton.click();

    expect(jsonInput.value).toBe("{");
    expect(app.querySelector<HTMLElement>(".status")?.textContent).toContain("JSON error:");
  });

  it("resets to the demo payload", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const jsonInput = getTextarea(app, ".json-input");
    const resetButton = getButton(app, ".reset-button");

    jsonInput.value = JSON.stringify({
      ...getDemoPayload(),
      viewport: {
        width: 500,
        height: 200
      }
    });
    jsonInput.dispatchEvent(new Event("input"));
    resetButton.click();

    expect(jsonInput.value).toBe(formatPayloadJson());
    expect(app.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 420 180");
    expect(app.querySelector<HTMLTextAreaElement>(".payload-output")?.value.startsWith("hsc1.")).toBe(true);
  });

  it("imports a valid hsc1 payload into the JSON editor", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const importInput = getTextarea(app, ".import-input");
    const importButton = getButton(app, ".import-button");
    const jsonInput = getTextarea(app, ".json-input");
    const updatedPayload = {
      ...getDemoPayload(),
      viewport: {
        width: 500,
        height: 200
      }
    };

    importInput.value = `  ${encodeDemoPayload(updatedPayload)}  `;
    importButton.click();

    expect(jsonInput.value).toBe(formatPayloadJson(updatedPayload));
    expect(app.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 500 200");
    expect(app.querySelector<HTMLTextAreaElement>(".payload-output")?.value.startsWith("hsc1.")).toBe(true);
    expect(app.querySelector<HTMLElement>(".status")?.textContent).toBe("Imported payload");
  });

  it("does not overwrite JSON when importing an invalid hsc1 payload", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const importInput = getTextarea(app, ".import-input");
    const importButton = getButton(app, ".import-button");
    const jsonInput = getTextarea(app, ".json-input");
    const originalJson = jsonInput.value;

    importInput.value = "not-hsc1";
    importButton.click();

    expect(jsonInput.value).toBe(originalJson);
    expect(app.querySelector("svg")).not.toBeNull();
    expect(app.querySelector<HTMLTextAreaElement>(".payload-output")?.value.startsWith("hsc1.")).toBe(true);
    expect(app.querySelector<HTMLElement>(".status")?.textContent).toContain("Import error:");
  });

  it("converts simple safe SVG markup into schema items", () => {
    const documentRef = createDocument();
    const result = parseSvgImport(`
      <svg viewBox="0 0 100 100">
        <style>.st0{fill:#000000;stroke:#ffffff;stroke-width:2}</style>
        <rect id="box" x="10" y="12" width="24" height="16" fill="none" stroke="currentColor" stroke-width="2" />
        <circle cx="50" cy="50" r="8" fill="var(--accent-color)" />
        <line x1="0" y1="0" x2="20" y2="10" stroke="#123456" />
        <polygon points="70,10 90,10 90,30" fill="none" />
        <path d="M 10 80 L 30 80" stroke="currentColor" fill="none" />
        <text x="10" y="95" class="st0">Imported</text>
      </svg>
    `, getDemoPayload(), documentRef);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("SVG import failed");
    }

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      type: "group",
      layer: 300,
      transform: [
        { type: "translate" },
        { type: "scale" },
        { type: "translate", x: -0, y: -0 }
      ]
    });

    const group = result.items[0];

    if (!group || group.type !== "group") {
      throw new Error("import did not return a group");
    }

    expect(group.children.map((item) => item.type)).toEqual(["rect", "circle", "line", "polyline", "path", "text"]);
    expect(group.children[0]).toMatchObject({
      id: "box",
      type: "rect",
      x: 10,
      y: 12,
      width: 24,
      height: 16,
      style: {
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2
      }
    });
    expect(group.children[3]).toMatchObject({
      type: "polyline",
      points: [
        { x: 70, y: 10 },
        { x: 90, y: 10 },
        { x: 90, y: 30 },
        { x: 70, y: 10 }
      ]
    });
    expect(group.children[5]).toMatchObject({
      type: "text",
      style: {
        fill: "#000000",
        stroke: "#ffffff",
        strokeWidth: 2
      }
    });
  });

  it("rejects unsafe SVG import content", () => {
    const documentRef = createDocument();
    const result = parseSvgImport(`
      <svg>
        <script>alert(1)</script>
        <rect x="0" y="0" width="10" height="10" onclick="alert(1)" />
      </svg>
    `, getDemoPayload(), documentRef);

    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error("unsafe SVG import unexpectedly succeeded");
    }

    expect(result.errors.join("\n")).toContain("<script> is not supported");
    expect(result.errors.join("\n")).toContain("event handlers are not supported");
  });

  it("imports pasted SVG into JSON, preview, item list, and export", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const svgInput = getTextarea(app, ".svg-import-input");

    svgInput.value = `
      <svg viewBox="0 0 100 80">
        <rect id="imported-box" x="10" y="15" width="30" height="20" fill="none" stroke="currentColor" />
        <text id="imported-label" x="15" y="60">SVG Label</text>
      </svg>
    `;
    getButton(app, ".import-svg-button").click();

    const importedGroup = getPayloadItem(app, "imported-svg-1");

    expect(importedGroup).toMatchObject({
      id: "imported-svg-1",
      type: "group",
      layer: 300
    });
    expect(getPayloadGroupChild(app, "imported-svg-1", "imported-box")).toMatchObject({ type: "rect" });
    expect(getPayloadGroupChild(app, "imported-svg-1", "imported-label")).toMatchObject({ type: "text" });
    expect(app.querySelector('[data-id="imported-box"]')).not.toBeNull();
    expect(getButton(app, '[data-item-id="imported-svg-1"]').textContent).toBe("imported-svg-1 (group)");
    expect(getTextarea(app, ".payload-output").value.startsWith("hsc1.")).toBe(true);
    expect(app.querySelector<HTMLElement>(".status")?.textContent).toContain("Imported 1 SVG items");
  });

  it("selects and nudges an imported SVG group from a child preview path", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const svgInput = getTextarea(app, ".svg-import-input");

    svgInput.value = `
      <svg viewBox="0 0 1000 1000">
        <path id="large-path" d="M 100 100 L 900 100 L 500 900 Z" fill="#000000" />
        <path id="large-highlight" d="M 300 300 L 700 300" stroke="#ffffff" stroke-width="40" fill="none" />
      </svg>
    `;
    getButton(app, ".import-svg-button").click();

    const importedGroup = getPayloadItem(app, "imported-svg-1");
    const initialTranslate = importedGroup?.transform?.find((entry) => entry.type === "translate");
    const childPath = app.querySelector('[data-id="large-path"]');

    if (!childPath || !initialTranslate || typeof initialTranslate.x !== "number") {
      throw new Error("imported SVG group missing");
    }

    childPath.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    app.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));

    const movedGroup = getPayloadItem(app, "imported-svg-1");
    const movedTranslate = movedGroup?.transform?.find((entry) => entry.type === "translate");

    expect(getButton(app, '[data-item-id="imported-svg-1"]').getAttribute("aria-pressed")).toBe("true");
    expect(movedTranslate?.x).toBe(initialTranslate.x + 1);
    expect(getTextarea(app, ".payload-output").value.startsWith("hsc1.")).toBe(true);
  });

  it("applies pasted theme variables to the preview surface", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const themeInput = getTextarea(app, ".theme-input");
    const applyThemeButton = getButton(app, ".apply-theme-button");
    const previewSurface = app.querySelector<HTMLElement>(".preview-surface");

    if (!previewSurface) {
      throw new Error("preview surface missing");
    }

    themeInput.value = JSON.stringify({
      type: "ha-schematic-card-theme-variables",
      version: 1,
      capturedAt: "2026-05-30T00:00:00.000Z",
      variables: {
        "--primary-text-color": "rgb(10, 20, 30)",
        "--accent-color": "rgb(40, 50, 60)",
        "--ha-card-background": "rgb(5, 6, 7)"
      }
    });
    applyThemeButton.click();

    expect(previewSurface.style.getPropertyValue("--primary-text-color")).toBe("rgb(10, 20, 30)");
    expect(previewSurface.style.getPropertyValue("--accent-color")).toBe("rgb(40, 50, 60)");
    expect(previewSurface.style.getPropertyValue("--ha-card-background")).toBe("rgb(5, 6, 7)");
    expect(app.querySelector<HTMLElement>(".theme-status")?.textContent).toBe("Applied 3 theme variables");
  });

  it("loads stored theme variables on startup", () => {
    const windowRef = new Window();
    const documentRef = windowRef.document as unknown as Document;
    const storedTheme = JSON.stringify({
      type: "ha-schematic-card-theme-variables",
      version: 1,
      capturedAt: "2026-05-30T00:00:00.000Z",
      variables: {
        "--ha-card-background": "rgb(1, 2, 3)"
      }
    });

    windowRef.localStorage.setItem("ha-schematic-card-editor-theme-preview", storedTheme);

    const app = createEditorApp(documentRef);
    const previewSurface = app.querySelector<HTMLElement>(".preview-surface");

    expect(getTextarea(app, ".theme-input").value).toBe(storedTheme);
    expect(previewSurface?.style.getPropertyValue("--ha-card-background")).toBe("rgb(1, 2, 3)");
    expect(app.querySelector<HTMLElement>(".theme-status")?.textContent).toBe("Applied 1 theme variables");
  });

  it("shows a theme error without changing payload JSON or preview", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const themeInput = getTextarea(app, ".theme-input");
    const applyThemeButton = getButton(app, ".apply-theme-button");
    const jsonInput = getTextarea(app, ".json-input");
    const originalJson = jsonInput.value;
    const originalExport = getTextarea(app, ".payload-output").value;

    themeInput.value = "{";
    applyThemeButton.click();

    expect(jsonInput.value).toBe(originalJson);
    expect(getTextarea(app, ".payload-output").value).toBe(originalExport);
    expect(app.querySelector("svg")).not.toBeNull();
    expect(app.querySelector<HTMLElement>(".theme-status")?.textContent).toContain("Theme JSON error:");
  });
});

function getTextarea(root: ParentNode, selector: string): HTMLTextAreaElement {
  const element = root.querySelector(selector);

  if (!(element instanceof HTMLTextAreaElement)) {
    throw new Error(`textarea missing: ${selector}`);
  }

  return element;
}

function getButton(root: ParentNode, selector: string): HTMLButtonElement {
  const element = root.querySelector(selector);

  if (!(element instanceof HTMLButtonElement)) {
    throw new Error(`button missing: ${selector}`);
  }

  return element;
}

function getInput(root: ParentNode, selector: string): HTMLInputElement {
  const element = root.querySelector(selector);

  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`input missing: ${selector}`);
  }

  return element;
}

function getInspectorInput(root: ParentNode, fieldName: string): HTMLInputElement {
  const field = getInspectorField(root, fieldName);
  const input = field.querySelector("input");

  if (input instanceof HTMLInputElement) {
    return input;
  }

  throw new Error(`inspector input missing: ${fieldName}`);
}

function getInspectorField(root: ParentNode, fieldName: string): HTMLElement {
  for (const field of root.querySelectorAll(".inspector-field")) {
    const label = field.querySelector(".field-label");

    if (field instanceof HTMLElement && (field.dataset.fieldName === fieldName || label?.textContent === fieldName)) {
      return field;
    }
  }

  throw new Error(`inspector field missing: ${fieldName}`);
}

function getSymbolSlotBindingInput(root: ParentNode, slotId: string): HTMLInputElement {
  return getInput(root, `.symbol-slot-binding-field[data-slot-id="${slotId}"] input`);
}

function clickPreviewPoint(
  app: HTMLElement,
  clientX: number,
  clientY: number,
  options: MouseEventInit = {}
): void {
  const svg = app.querySelector("svg");

  if (!svg) {
    throw new Error("preview svg missing");
  }

  setSvgBounds(svg, { left: 0, top: 0, width: 420, height: 180 });
  svg.dispatchEvent(new MouseEvent("click", { clientX, clientY, bubbles: true, ...options }));
}

function clickPreviewItem(app: HTMLElement, itemId: string, options: MouseEventInit = {}): void {
  const item = app.querySelector(`[data-id="${itemId}"]`);

  if (!item) {
    throw new Error(`preview item missing: ${itemId}`);
  }

  item.dispatchEvent(new MouseEvent("click", { bubbles: true, ...options }));
}

function movePreviewPointer(
  app: HTMLElement,
  clientX: number,
  clientY: number,
  options: MouseEventInit = {}
): void {
  const svg = app.querySelector("svg");

  if (!svg) {
    throw new Error("preview svg missing");
  }

  setSvgBounds(svg, { left: 0, top: 0, width: 420, height: 180 });
  svg.dispatchEvent(new MouseEvent("mousemove", { clientX, clientY, bubbles: true, ...options }));
}

function openPolylineContextMenu(app: HTMLElement, clientX: number, clientY: number): void {
  const polyline = app.querySelector('[data-id="polyline-1"]');
  const svg = app.querySelector("svg");

  if (!polyline || !svg) {
    throw new Error("polyline preview item missing");
  }

  setSvgBounds(svg, { left: 0, top: 0, width: 420, height: 180 });
  polyline.dispatchEvent(new MouseEvent("contextmenu", { clientX, clientY, bubbles: true }));
}

function openPolylineHandleContextMenu(app: HTMLElement, pointIndex: number): void {
  const handle = app.querySelector(`.editor-polyline-handle-hitbox[data-polyline-handle="polyline-1"][data-point-index="${pointIndex}"]`);
  const svg = app.querySelector("svg");

  if (!handle || !svg) {
    throw new Error("polyline handle missing");
  }

  setSvgBounds(svg, { left: 0, top: 0, width: 420, height: 180 });
  handle.dispatchEvent(new MouseEvent("contextmenu", { clientX: 60, clientY: 40, bubbles: true }));
}

function openItemContextMenu(app: HTMLElement, itemId: string): void {
  const item = app.querySelector(`[data-id="${itemId}"]`);
  const svg = app.querySelector("svg");

  if (!item || !svg) {
    throw new Error(`preview item missing: ${itemId}`);
  }

  setSvgBounds(svg, { left: 0, top: 0, width: 420, height: 180 });
  item.dispatchEvent(new MouseEvent("contextmenu", { clientX: 80, clientY: 50, bubbles: true }));
}

function openEmptyPreviewContextMenu(app: HTMLElement, clientX: number, clientY: number): void {
  const svg = app.querySelector("svg");

  if (!svg) {
    throw new Error("preview svg missing");
  }

  setSvgBounds(svg, { left: 0, top: 0, width: 420, height: 180 });
  svg.dispatchEvent(new MouseEvent("contextmenu", { clientX, clientY, bubbles: true }));
}

function drawTwoPointPolyline(app: HTMLElement): void {
  getButton(app, ".draw-polyline-button").click();
  clickPreviewPoint(app, 13, 14);
  clickPreviewPoint(app, 56, 44);
  getButton(app, ".finish-polyline-button").click();
}

function getPolylinePoints(app: HTMLElement, itemId: string): unknown[] {
  const parsed = JSON.parse(getTextarea(app, ".json-input").value) as {
    items: Array<{ id: string; points?: unknown[] }>;
  };
  return parsed.items.find((item) => item.id === itemId)?.points ?? [];
}

function getPayloadItem(
  app: HTMLElement,
  itemId: string
): {
  id: string;
  type?: string;
  layer: number;
  style?: Record<string, unknown>;
  slotBindings?: Record<string, string>;
  children?: Array<{ id: string; type?: string }>;
  transform?: Array<Record<string, unknown>>;
} | undefined {
  const parsed = JSON.parse(getTextarea(app, ".json-input").value) as {
    items: Array<{
      id: string;
      type?: string;
      layer: number;
      style?: Record<string, unknown>;
      slotBindings?: Record<string, string>;
      children?: Array<{ id: string; type?: string }>;
      transform?: Array<Record<string, unknown>>;
    }>;
  };
  return parsed.items.find((item) => item.id === itemId);
}

function getPayloadGroupChild(
  app: HTMLElement,
  groupId: string,
  childId: string
): { id: string; type?: string } | undefined {
  return getPayloadItem(app, groupId)?.children?.find((child) => child.id === childId);
}

type TestSymbol = {
  id: string;
  parts?: Array<{ id: string; label?: string }>;
  entitySlots?: Array<{ id: string; label?: string; valueType?: string }>;
  items: TestItem[];
};

type TestItem = {
  id: string;
  type?: string;
  partId?: string;
  cx?: number;
  cy?: number;
  style?: Record<string, unknown>;
  children?: TestItem[];
};

function getSymbol(app: HTMLElement, symbolId: string): TestSymbol | undefined {
  const parsed = JSON.parse(getTextarea(app, ".json-input").value) as {
    symbols?: TestSymbol[];
  };
  return parsed.symbols?.find((symbol) => symbol.id === symbolId);
}

function getSymbolInternalItem(app: HTMLElement, symbolId: string, itemId: string): TestItem | undefined {
  const symbol = getSymbol(app, symbolId);

  if (!symbol) {
    return undefined;
  }

  return findNestedTestItem(symbol.items, itemId);
}

function findNestedTestItem(items: TestItem[], itemId: string): TestItem | undefined {
  for (const item of items) {
    if (item.id === itemId) {
      return item;
    }

    const child = item.children ? findNestedTestItem(item.children, itemId) : undefined;

    if (child) {
      return child;
    }
  }

  return undefined;
}

function getPositionedPayloadItem(
  app: HTMLElement,
  itemId: string
): { id: string; x?: number; y?: number } | undefined {
  const parsed = JSON.parse(getTextarea(app, ".json-input").value) as {
    items: Array<{ id: string; x?: number; y?: number }>;
  };
  return parsed.items.find((item) => item.id === itemId);
}

function setSvgBounds(
  svg: SVGSVGElement,
  rect: { left: number; top: number; width: number; height: number }
): void {
  setElementBounds(svg, rect);
}

function setElementBounds(
  element: Element,
  rect: { left: number; top: number; width: number; height: number }
): void {
  Object.defineProperty(element, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      ...rect,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      x: rect.left,
      y: rect.top,
      toJSON: () => rect
    })
  });
}
