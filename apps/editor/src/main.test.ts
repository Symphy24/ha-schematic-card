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

    expect(app.dataset.sidebar).toBe("collapsed");
    expect(app.dataset.workspace).toBe("card");
    expect(app.dataset.previewTheme).toBe("default");
    expect(app.querySelector(".editor-rail")).not.toBeNull();
    expect(app.querySelector(".editor-sidebar")).toBeNull();
    expect(app.querySelector(".editor-rail-brand")).toBeNull();
    expect(app.querySelector(".editor-rail-compact")).toBeNull();
    expect(app.querySelector(".editor-resize-handle")).toBeNull();
    expect(app.querySelector(".editor-topbar")).not.toBeNull();
    expect(app.querySelector(".card-editor-workspace")).not.toBeNull();
    expect(app.querySelector<HTMLElement>(".card-editor-workspace")?.hidden).toBe(false);
    expect(app.querySelector<HTMLElement>(".symbol-editor-workspace")?.hidden).toBe(true);
    expect(app.querySelector(".floating-panel-toolbar")).toBeNull();
    expect(app.querySelector(".card-editor-workspace .pane-header .editor-topbar")).not.toBeNull();
    expect(app.querySelector(".card-editor-workspace .pane-header [data-open-panel]")).toBeNull();
    expect(app.querySelector(".card-editor-workspace .pane-header [data-transfer-mode]")).toBeNull();
    expect(app.querySelector(".card-editor-workspace .pane-title")).toBeNull();
    expect(getFloatingPanel(app, "items").querySelector(".item-list-section")).not.toBeNull();
    expect(getFloatingPanel(app, "inspector").querySelector(".inspector-section")).not.toBeNull();
    expect(getFloatingPanel(app, "json").querySelector(".json-editor-section")).not.toBeNull();
    expect(getButton(app, ".select-tool-button").getAttribute("aria-pressed")).toBe("true");
    expect(app.querySelector<HTMLTextAreaElement>(".json-input")?.value).toBe(formatPayloadJson());
    expect(app.querySelector("svg")).not.toBeNull();
    expect(app.querySelector('[data-editor-grid="true"]')).not.toBeNull();
    expect(app.querySelector(".preview-surface [data-editor-grid='true'] path")).not.toBeNull();
    expect(app.querySelector(".preview-surface svg")?.lastElementChild).toBe(app.querySelector(".preview-surface [data-editor-grid='true']"));
    expect(app.querySelector<HTMLTextAreaElement>(".payload-output")?.value.startsWith("hsc1.")).toBe(true);
    expect(app.querySelector<HTMLElement>(".status")?.textContent).toBe("Valid payload");
  });

  it("collapses and expands the Odysseus navigation sidebar from the rail", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const toggleButton = getButton(app, ".sidebar-toggle-button");

    expect(toggleButton.getAttribute("aria-expanded")).toBe("false");
    expect(app.querySelector(".sidebar")).not.toBeNull();
    expect(app.querySelector(".icon-rail")).toBeNull();
    expect(app.querySelector(".editor-sidebar")).toBeNull();
    const rail = app.querySelector<HTMLElement>(".editor-rail");
    const sidebarButtons = Array.from(app.querySelectorAll<HTMLButtonElement>(".sidebar .editor-nav-entry"));

    if (!rail) {
      throw new Error("rail missing");
    }

    expect(rail.children[0]).toBe(toggleButton);
    expect(rail.children[1]).toBe(app.querySelector(".sidebar-header"));
    expect(rail.children[2]).toBe(app.querySelector(".sidebar-inner"));
    expect(sidebarButtons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "Card editor",
      "Symbol editor",
      "Inspector",
      "Item List",
      "JSON Editor",
      "Import Payload",
      "Import SVG",
      "Export / Payload",
      "Simulation",
      "Layers / Object Tree",
      "Theme",
      "HA Preview",
      "Symbol Items",
      "Symbol Parts",
      "Symbol Slots",
      "Symbol Inspector",
      "Import SVG",
      "Theme"
    ]);

    toggleButton.click();
    expect(app.dataset.sidebar).toBe("expanded");
    expect(toggleButton.getAttribute("aria-expanded")).toBe("true");
    expect(getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="items"]').textContent).toContain("Item List");
    expect(getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="json"]').textContent).toContain("JSON Editor");
    expect(getButton(app, '.editor-nav-entry[data-transfer-mode="import"]').textContent).toContain("Import");
    expect(getButton(app, '.editor-nav-entry[data-transfer-mode="svg"]').textContent).toContain("SVG");
    expect(getButton(app, '.editor-nav-entry[data-transfer-mode="export"]').textContent).toContain("Export");
    expect(getButton(app, '.editor-nav-entry[data-open-panel="app-theme"]').textContent).toContain("Theme");
    expect(getButton(app, '.editor-nav-entry[data-transfer-mode="theme"]').textContent).toContain("HA Preview");
    expect(app.querySelector(".sidebar")?.classList.contains("hidden")).toBe(false);

    toggleButton.click();
    expect(app.dataset.sidebar).toBe("collapsed");
    expect(toggleButton.getAttribute("aria-expanded")).toBe("false");
  });

  it("minimizes and restores floating panels from the bottom dock", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const inspectorPanel = getFloatingPanel(app, "inspector");

    expect(app.querySelectorAll(".floating-panel").length).toBe(10);
    getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="inspector"]').click();
    expect(inspectorPanel.dataset.panelState).toBe("open");

    getButton(inspectorPanel, ".floating-panel-minimize").click();
    expect(inspectorPanel.dataset.panelState).toBe("minimized");
    expect(inspectorPanel.hidden).toBe(true);

    const dockChip = getButton(app, '[data-dock-panel="inspector"]');
    expect(dockChip.textContent).toBe("Inspector");

    dockChip.click();
    expect(inspectorPanel.dataset.panelState).toBe("open");
    expect(inspectorPanel.hidden).toBe(false);
    expect(app.querySelector('[data-dock-panel="inspector"]')).toBeNull();
  });

  it("closes floating panels and reopens them from the sidebar", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const itemsPanel = getFloatingPanel(app, "items");

    getButton(itemsPanel, ".floating-panel-close").click();
    expect(itemsPanel.dataset.panelState).toBe("closed");
    expect(itemsPanel.hidden).toBe(true);

    getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="items"]').click();
    expect(itemsPanel.dataset.panelState).toBe("open");
    expect(itemsPanel.hidden).toBe(false);
  });

  it("minimizes floating panels and restores one docked panel", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="items"]').click();
    getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="json"]').click();
    getButton(getFloatingPanel(app, "items"), ".floating-panel-minimize").click();
    getButton(getFloatingPanel(app, "json"), ".floating-panel-minimize").click();

    expect(app.querySelectorAll(".floating-panel-dock-chip").length).toBe(2);
    for (const panel of Array.from(app.querySelectorAll<HTMLElement>(".floating-panel"))) {
      if (panel.dataset.panelId === "items" || panel.dataset.panelId === "json") {
        expect(panel.dataset.panelState).toBe("minimized");
        expect(panel.hidden).toBe(true);
      }
    }

    getButton(app, '[data-dock-panel="json"]').click();
    expect(getFloatingPanel(app, "json").dataset.panelState).toBe("open");
    expect(app.querySelectorAll(".floating-panel-dock-chip").length).toBe(1);
  });

  it("opens existing export behavior from the sidebar", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const transferPanel = app.querySelector<HTMLElement>(".transfer-panel");

    if (!transferPanel) {
      throw new Error("transfer panel missing");
    }

    expect(transferPanel.hidden).toBe(true);
    expect(app.querySelector(".card-editor-workspace .pane-header [data-transfer-mode]")).toBeNull();
    getButton(app, '.editor-nav-entry[data-transfer-mode="export"]').click();
    expect(transferPanel.hidden).toBe(false);
    expect(transferPanel.dataset.mode).toBe("export");
    expect(app.querySelector<HTMLTextAreaElement>(".payload-output")?.value.startsWith("hsc1.")).toBe(true);
  });

  it("drags floating panels by their headers", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="inspector"]').click();
    const panel = getFloatingPanel(app, "inspector");
    const header = panel.querySelector<HTMLElement>(".floating-panel-header");
    const layer = app.querySelector<HTMLElement>(".floating-panel-layer");

    if (!header || !layer) {
      throw new Error("floating panel drag elements missing");
    }

    setElementBounds(layer, { left: 0, top: 0, width: 1200, height: 800 });
    setElementBounds(panel, { left: 720, top: 18, width: 380, height: 320 });
    Object.defineProperty(layer, "clientWidth", { configurable: true, value: 1200 });
    Object.defineProperty(layer, "clientHeight", { configurable: true, value: 800 });
    Object.defineProperty(panel, "offsetWidth", { configurable: true, value: 380 });
    Object.defineProperty(panel, "offsetHeight", { configurable: true, value: 320 });

    header.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 740, clientY: 38 }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 800, clientY: 200 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup", { clientX: 800, clientY: 200 }));

    expect(panel.style.left).toBe("780px");
    expect(panel.style.top).toBe("180px");
  });

  it("docks, stacks, reorders, and undocks managed panels", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const layer = app.querySelector<HTMLElement>(".floating-panel-layer");

    if (!layer) {
      throw new Error("floating panel layer missing");
    }

    setElementBounds(layer, { left: 0, top: 0, width: 1200, height: 800 });
    Object.defineProperty(layer, "clientWidth", { configurable: true, value: 1200 });
    Object.defineProperty(layer, "clientHeight", { configurable: true, value: 800 });

    getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="inspector"]').click();
    getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="json"]').click();
    getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="items"]').click();

    const inspectorPanel = getFloatingPanel(app, "inspector");
    const jsonPanel = getFloatingPanel(app, "json");
    const itemsPanel = getFloatingPanel(app, "items");
    const leftZone = app.querySelector<HTMLElement>('[data-dock-zone="left"]');

    if (!leftZone) {
      throw new Error("left dock zone missing");
    }

    dockPanelByDrag(documentRef, layer, inspectorPanel, { left: 720, top: 18, width: 380, height: 320 }, 24, 180);
    dockPanelByDrag(documentRef, layer, jsonPanel, { left: 720, top: 360, width: 420, height: 260 }, 24, 420);
    dockPanelByDrag(documentRef, layer, itemsPanel, { left: 24, top: 132, width: 340, height: 280 }, 24, 680);

    expect(inspectorPanel.dataset.panelState).toBe("docked");
    expect(jsonPanel.dataset.panelState).toBe("docked");
    expect(itemsPanel.dataset.panelState).toBe("docked");
    expect(Array.from(leftZone.querySelectorAll<HTMLElement>(".floating-panel")).map((panel) => panel.dataset.panelId)).toEqual([
      "inspector",
      "json",
      "items"
    ]);

    setElementBounds(inspectorPanel, { left: 0, top: 150, width: 320, height: 180 });
    setElementBounds(jsonPanel, { left: 0, top: 340, width: 320, height: 180 });
    setElementBounds(itemsPanel, { left: 0, top: 530, width: 320, height: 180 });
    getPanelHeader(itemsPanel).dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 20, clientY: 550 }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 20, clientY: 120 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup", { clientX: 20, clientY: 120 }));

    expect(Array.from(leftZone.querySelectorAll<HTMLElement>(".floating-panel")).map((panel) => panel.dataset.panelId)).toEqual([
      "items",
      "inspector",
      "json"
    ]);

    getPanelHeader(itemsPanel).dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 20, clientY: 120 }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 520, clientY: 220 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup", { clientX: 520, clientY: 220 }));
    expect(itemsPanel.dataset.panelState).toBe("open");
    expect(itemsPanel.parentElement?.classList.contains("floating-panels")).toBe(true);
  });

  it("limits side stacks to three panels and previews the insertion slot", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const layer = app.querySelector<HTMLElement>(".floating-panel-layer");
    const leftZone = app.querySelector<HTMLElement>('[data-dock-zone="left"]');

    if (!layer || !leftZone) {
      throw new Error("left dock zone missing");
    }

    setElementBounds(layer, { left: 0, top: 0, width: 1200, height: 800 });
    setElementBounds(leftZone, { left: 0, top: 0, width: 456, height: 800 });
    Object.defineProperty(layer, "clientWidth", { configurable: true, value: 1200 });
    Object.defineProperty(layer, "clientHeight", { configurable: true, value: 800 });

    getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="inspector"]').click();
    getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="json"]').click();
    getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="items"]').click();
    getButton(app, '[data-transfer-mode="export"]').click();

    const inspectorPanel = getFloatingPanel(app, "inspector");
    const jsonPanel = getFloatingPanel(app, "json");
    const itemsPanel = getFloatingPanel(app, "items");
    const transferPanel = getFloatingPanel(app, "transfer");

    dockPanelByDrag(documentRef, layer, inspectorPanel, { left: 720, top: 18, width: 380, height: 320 }, 24, 160);
    setElementBounds(inspectorPanel, { left: 0, top: 0, width: 456, height: 800 });

    setElementBounds(jsonPanel, { left: 720, top: 360, width: 420, height: 260 });
    Object.defineProperty(jsonPanel, "offsetWidth", { configurable: true, value: 420 });
    Object.defineProperty(jsonPanel, "offsetHeight", { configurable: true, value: 260 });
    getPanelHeader(jsonPanel).dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 740, clientY: 380 }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 24, clientY: 620 }));

    const ghost = app.querySelector<HTMLElement>("#tile-ghost");
    expect(ghost?.classList.contains("visible")).toBe(true);
    expect(ghost?.style.top).toBe("400px");
    expect(ghost?.style.height).toBe("400px");

    documentRef.dispatchEvent(new MouseEvent("mouseup", { clientX: 24, clientY: 620 }));
    dockPanelByDrag(documentRef, layer, itemsPanel, { left: 24, top: 132, width: 340, height: 280 }, 24, 680);
    dockPanelByDrag(documentRef, layer, transferPanel, { left: 180, top: 96, width: 420, height: 320 }, 24, 420);

    expect(Array.from(leftZone.querySelectorAll<HTMLElement>(".floating-panel")).map((panel) => panel.dataset.panelId)).toEqual([
      "inspector",
      "json",
      "items"
    ]);
    expect(transferPanel.dataset.panelState).toBe("open");
    expect(transferPanel.dataset.snapRejected).toBe("left");
  });

  it("resizes stacked side panels with split dividers and restores ratios per workspace", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const layer = app.querySelector<HTMLElement>(".floating-panel-layer");
    const leftZone = app.querySelector<HTMLElement>('[data-dock-zone="left"]');

    if (!layer || !leftZone) {
      throw new Error("left dock zone missing");
    }

    setElementBounds(layer, { left: 0, top: 0, width: 1200, height: 800 });
    setElementBounds(leftZone, { left: 0, top: 0, width: 456, height: 800 });
    Object.defineProperty(layer, "clientWidth", { configurable: true, value: 1200 });
    Object.defineProperty(layer, "clientHeight", { configurable: true, value: 800 });

    getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="inspector"]').click();
    getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="json"]').click();
    const inspectorPanel = getFloatingPanel(app, "inspector");
    const jsonPanel = getFloatingPanel(app, "json");

    dockPanelByDrag(documentRef, layer, inspectorPanel, { left: 720, top: 18, width: 380, height: 320 }, 24, 160);
    dockPanelByDrag(documentRef, layer, jsonPanel, { left: 720, top: 360, width: 420, height: 260 }, 24, 640);

    const divider = leftZone.querySelector<HTMLElement>(".floating-panel-split-divider");
    if (!divider) {
      throw new Error("side split divider missing");
    }

    divider.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientY: 400 }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientY: 500 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    expect(Number(inspectorPanel.dataset.dockRatio)).toBeCloseTo(0.625, 3);
    expect(Number(jsonPanel.dataset.dockRatio)).toBeCloseTo(0.375, 3);

    getButton(app, '.editor-nav-entry[data-workspace-mode="symbol"]').click();
    expect(inspectorPanel.dataset.panelState).toBe("closed");

    getButton(app, '.editor-nav-entry[data-workspace-mode="card"]').click();
    expect(inspectorPanel.dataset.panelState).toBe("docked");
    expect(jsonPanel.dataset.panelState).toBe("docked");
    expect(Number(inspectorPanel.dataset.dockRatio)).toBeCloseTo(0.625, 3);
    expect(Number(jsonPanel.dataset.dockRatio)).toBeCloseTo(0.375, 3);
    expect(leftZone.querySelectorAll(".floating-panel-split-divider").length).toBe(1);
  });

  it("keeps separate floating panel layouts for card and symbol workspaces", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const layer = app.querySelector<HTMLElement>(".floating-panel-layer");
    const rightZone = app.querySelector<HTMLElement>('[data-dock-zone="right"]');

    if (!layer || !rightZone) {
      throw new Error("workspace panel state elements missing");
    }

    setElementBounds(layer, { left: 0, top: 0, width: 1200, height: 800 });
    Object.defineProperty(layer, "clientWidth", { configurable: true, value: 1200 });
    Object.defineProperty(layer, "clientHeight", { configurable: true, value: 800 });

    getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="json"]').click();
    getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="items"]').click();
    const jsonPanel = getFloatingPanel(app, "json");
    const itemsPanel = getFloatingPanel(app, "items");

    dockPanelByDrag(documentRef, layer, jsonPanel, { left: 720, top: 360, width: 420, height: 260 }, 1190, 240);
    itemsPanel.style.left = "76px";
    itemsPanel.style.top = "540px";

    expect(jsonPanel.dataset.panelState).toBe("docked");
    expect(jsonPanel.parentElement).toBe(rightZone);
    expect(itemsPanel.dataset.panelState).toBe("open");

    getButton(app, '.editor-nav-entry[data-workspace-mode="symbol"]').click();
    expect(app.dataset.workspace).toBe("symbol");
    expect(jsonPanel.dataset.panelState).toBe("closed");
    expect(itemsPanel.dataset.panelState).toBe("closed");

    getButton(app, '.editor-nav-entry[data-open-panel="symbol-parts"]').click();
    const symbolPartsPanel = getFloatingPanel(app, "symbol-parts");
    dockPanelByDrag(documentRef, layer, symbolPartsPanel, { left: 360, top: 118, width: 340, height: 280 }, 1190, 300);
    expect(symbolPartsPanel.dataset.panelState).toBe("docked");
    expect(symbolPartsPanel.parentElement).toBe(rightZone);

    getButton(app, '.editor-nav-entry[data-workspace-mode="card"]').click();
    expect(app.dataset.workspace).toBe("card");
    expect(jsonPanel.dataset.panelState).toBe("docked");
    expect(jsonPanel.parentElement).toBe(rightZone);
    expect(itemsPanel.dataset.panelState).toBe("open");
    expect(itemsPanel.style.left).toBe("76px");
    expect(itemsPanel.style.top).toBe("540px");
    expect(symbolPartsPanel.dataset.panelState).toBe("closed");

    getButton(app, '.editor-nav-entry[data-workspace-mode="symbol"]').click();
    expect(app.dataset.workspace).toBe("symbol");
    expect(jsonPanel.dataset.panelState).toBe("closed");
    expect(symbolPartsPanel.dataset.panelState).toBe("docked");
    expect(symbolPartsPanel.parentElement).toBe(rightZone);
  });

  it("opens item and inspector panels from the navigation launchers", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const itemsLauncher = getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="items"]');
    const inspectorLauncher = getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="inspector"]');
    const itemListSection = app.querySelector<HTMLElement>(".item-list-section");
    const inspectorSection = app.querySelector<HTMLElement>(".inspector-section");

    if (!itemListSection || !inspectorSection) {
      throw new Error("tab sections missing");
    }

    expect(itemListSection.hidden).toBe(false);
    expect(inspectorSection.hidden).toBe(false);

    getButton(getFloatingPanel(app, "inspector"), ".floating-panel-close").click();
    expect(getFloatingPanel(app, "inspector").hidden).toBe(true);
    inspectorLauncher.click();

    expect(itemListSection.hidden).toBe(false);
    expect(inspectorSection.hidden).toBe(false);
    expect(getFloatingPanel(app, "inspector").hidden).toBe(false);
    expect(inspectorLauncher.getAttribute("aria-pressed")).toBe("true");

    getButton(getFloatingPanel(app, "items"), ".floating-panel-close").click();
    expect(getFloatingPanel(app, "items").hidden).toBe(true);
    itemsLauncher.click();
    expect(getFloatingPanel(app, "items").hidden).toBe(false);
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
    expect(app.querySelector(".symbol-tabs")).toBeNull();
    expect(app.querySelector(".symbol-tab-drop-zone")).toBeNull();
    expect(getFloatingPanel(app, "symbol-items").querySelector(".symbol-items-section")).not.toBeNull();
    expect(getFloatingPanel(app, "symbol-parts").querySelector(".symbol-parts-section")).not.toBeNull();
    expect(getFloatingPanel(app, "symbol-slots").querySelector(".symbol-slots-section")).not.toBeNull();
    expect(getFloatingPanel(app, "symbol-inspector").querySelector(".symbol-editor-inspector")).not.toBeNull();
    expect(getButton(app, '[data-symbol-item-id="unit-box"]').textContent).toContain("unit-box (rect, body)");
    expect(app.querySelector<HTMLElement>(".symbol-parts-list")?.textContent).toContain("body - Symbol body");
    expect(app.querySelector<HTMLElement>(".symbol-slots-list")?.textContent).toContain("running - Running state");

    getButton(app, ".open-symbol-items-panel-button").click();
    expect(getFloatingPanel(app, "symbol-items").hidden).toBe(false);
    getButton(app, ".open-symbol-items-panel-button").click();
    expect(getFloatingPanel(app, "symbol-items").hidden).toBe(true);

    getButton(app, ".open-symbol-import-panel-button").click();
    expect(getFloatingPanel(app, "symbol-import").hidden).toBe(false);
    expect(getFloatingPanel(app, "symbol-import").querySelector(".symbol-import-dialog")).not.toBeNull();
    getButton(app, ".cancel-symbol-import-button").click();
    expect(getFloatingPanel(app, "symbol-import").hidden).toBe(true);

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
    getButton(app, ".open-symbol-import-panel-button").click();
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

    expect(getInput(app, ".symbol-id-input").value).toBe("demo-generic-unit");
    expect(app.querySelector(".symbol-part-detail-card[data-part-id='body']")).not.toBeNull();

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
    expect(app.querySelector(".symbol-slot-detail-card[data-slot-id='temperature']")).not.toBeNull();

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

  it("edits symbol metadata and selected part/slot detail cards", () => {
    const windowRef = new Window();
    const documentRef = windowRef.document as unknown as Document;
    Object.defineProperty(windowRef, "confirm", {
      configurable: true,
      value: () => true
    });
    const app = createEditorApp(documentRef);

    getButton(app, ".open-symbol-editor-button").click();
    getButton(app, ".symbol-start-edit-button").click();

    const symbolIdInput = getInput(app, ".symbol-id-input");
    symbolIdInput.value = "demo-unit-renamed";
    symbolIdInput.dispatchEvent(new Event("change"));

    expect(getSymbol(app, "demo-unit-renamed")).toBeDefined();
    expect(getSymbol(app, "demo-generic-unit")).toBeUndefined();
    expect(getSymbolInstanceIds(app)).toEqual(["demo-unit-renamed", "demo-unit-renamed"]);
    expect(app.querySelector<HTMLSelectElement>(".symbol-select")?.value).toBe("demo-unit-renamed");

    const viewportWidthInput = getInput(app, ".symbol-viewport-width-input");
    viewportWidthInput.value = "140";
    viewportWidthInput.dispatchEvent(new Event("change"));

    expect(getSymbol(app, "demo-unit-renamed")?.viewport?.width).toBe(140);

    const bodyRow = app.querySelector<HTMLElement>('.symbol-part-row[data-part-id="body"]');
    bodyRow?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(app.querySelector(".symbol-part-detail-card[data-part-id='body']")).not.toBeNull();

    const partDetailId = getInput(app, ".symbol-part-detail-id-input");
    partDetailId.value = "shell";
    partDetailId.dispatchEvent(new Event("change"));

    expect(getSymbol(app, "demo-unit-renamed")?.parts?.some((part) => part.id === "shell")).toBe(true);
    expect(getSymbolInternalItem(app, "demo-unit-renamed", "unit-box")?.partId).toBe("shell");
    expect(app.querySelector(".symbol-part-detail-card[data-part-id='shell']")).not.toBeNull();

    getInput(app, ".symbol-add-part-input").value = "temporary";
    getButton(app, ".symbol-add-part-button").click();
    expect(getSymbol(app, "demo-unit-renamed")?.parts?.some((part) => part.id === "temporary")).toBe(true);
    getButton(app, ".symbol-detail-delete-part-button").click();
    expect(getSymbol(app, "demo-unit-renamed")?.parts?.some((part) => part.id === "temporary")).toBe(false);

    getInput(app, ".symbol-add-slot-input").value = "mode";
    getButton(app, ".symbol-add-slot-button").click();
    expect(app.querySelector(".symbol-slot-detail-card[data-slot-id='mode']")).not.toBeNull();

    const slotType = app.querySelector<HTMLSelectElement>(".symbol-slot-detail-type-select");
    expect(slotType).not.toBeNull();
    slotType!.value = "text";
    slotType!.dispatchEvent(new Event("change"));

    const required = getInput(app, ".symbol-slot-detail-required-input");
    required.checked = true;
    required.dispatchEvent(new Event("change"));

    expect(getSymbol(app, "demo-unit-renamed")?.entitySlots?.find((slot) => slot.id === "mode")).toMatchObject({
      valueType: "text",
      required: true
    });

    getButton(app, ".symbol-detail-delete-slot-button").click();
    expect(getSymbol(app, "demo-unit-renamed")?.entitySlots?.some((slot) => slot.id === "mode")).toBe(false);
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
    const symbolGridButton = getButton(app, ".symbol-grid-toggle-button");
    const symbolSnapButton = getButton(app, ".symbol-snap-toggle-button");
    const symbolGridSizeInput = getInput(app, ".symbol-grid-size-input");

    if (!svg || !statusDot) {
      throw new Error("symbol preview target missing");
    }

    expect(svg.getAttribute("viewBox")).toBe("-16 -14 96 84");
    expect(symbolGridButton.disabled).toBe(false);
    expect(symbolGridButton.getAttribute("aria-pressed")).toBe("true");
    expect(symbolSnapButton.disabled).toBe(false);
    expect(symbolSnapButton.getAttribute("aria-pressed")).toBe("true");
    expect(symbolGridSizeInput.value).toBe("10");
    expect(app.querySelector(".symbol-preview-surface [data-editor-grid='true'] path")).not.toBeNull();
    expect(svg.lastElementChild).toBe(app.querySelector(".symbol-preview-surface [data-editor-grid='true']"));

    symbolGridButton.click();
    expect(symbolGridButton.getAttribute("aria-pressed")).toBe("false");
    expect(getButton(app, ".toggle-grid-button").getAttribute("aria-pressed")).toBe("false");
    expect(app.querySelector(".symbol-preview-surface [data-editor-grid='true']")).toBeNull();
    expect(app.querySelector(".preview-surface [data-editor-grid='true']")).toBeNull();

    symbolGridButton.click();
    expect(symbolGridButton.getAttribute("aria-pressed")).toBe("true");
    expect(getButton(app, ".toggle-grid-button").getAttribute("aria-pressed")).toBe("true");
    expect(app.querySelector(".symbol-preview-surface [data-editor-grid='true'] path")).not.toBeNull();

    symbolGridSizeInput.value = "20";
    symbolGridSizeInput.dispatchEvent(new Event("change"));
    expect(app.querySelector(".symbol-preview-surface [data-editor-grid='true']")?.getAttribute("data-grid-size")).toBe("20");
    expect(app.querySelector(".preview-surface [data-editor-grid='true']")?.getAttribute("data-grid-size")).toBe("20");
    expect(getInput(app, ".grid-size-input").value).toBe("20");

    symbolGridSizeInput.value = "10";
    symbolGridSizeInput.dispatchEvent(new Event("change"));

    symbolSnapButton.click();
    expect(symbolSnapButton.getAttribute("aria-pressed")).toBe("false");
    expect(getButton(app, ".toggle-snap-button").getAttribute("aria-pressed")).toBe("false");
    symbolSnapButton.click();
    expect(symbolSnapButton.getAttribute("aria-pressed")).toBe("true");
    expect(getButton(app, ".toggle-snap-button").getAttribute("aria-pressed")).toBe("true");

    const refreshedSvg = app.querySelector<SVGSVGElement>(".symbol-preview-surface svg");
    const refreshedStatusDot = app.querySelector<Element>('.symbol-preview-surface [data-id="unit-status-dot"]');

    if (!refreshedSvg || !refreshedStatusDot) {
      throw new Error("refreshed symbol preview target missing");
    }

    setSvgBounds(refreshedSvg, { left: 0, top: 0, width: 320, height: 280 });
    const wheelEvent = new MouseEvent("wheel", {
      clientX: 160,
      clientY: 140,
      bubbles: true,
      cancelable: true
    });
    Object.defineProperty(wheelEvent, "deltaY", { value: -100 });
    refreshedSvg.dispatchEvent(wheelEvent);

    expectSvgViewBox(refreshedSvg, { width: 86.4, height: 75.6 });

    getButton(app, ".symbol-pan-tool-button").click();
    refreshedSvg.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 100, clientY: 80, bubbles: true }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 120, clientY: 110 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    expectSvgViewBox(refreshedSvg, { width: 86.4, height: 75.6 });

    getButton(app, ".symbol-reset-view-button").click();
    expect(refreshedSvg.getAttribute("viewBox")).toBe("-16 -14 96 84");

    getButton(app, ".symbol-select-tool-button").click();
    refreshedStatusDot.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 48, clientY: 12, bubbles: true }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 58, clientY: 22 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    expect(getSymbolInternalItem(app, "demo-generic-unit", "unit-status-dot")?.cx).toBe(60);
    expect(getSymbolInternalItem(app, "demo-generic-unit", "unit-status-dot")?.cy).toBe(20);

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
    expect(getFloatingPanel(app, "symbol-import").hidden).toBe(true);
  });

  it("does not change JSON when Symbol Editor SVG import is unsafe", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const jsonInput = getTextarea(app, ".json-input");
    const originalJson = jsonInput.value;

    getButton(app, ".open-symbol-editor-button").click();
    getButton(app, ".symbol-start-edit-button").click();
    getButton(app, ".open-symbol-import-panel-button").click();
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

  it("opens floating editor panels from the navigation launchers without moving their content", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const inspectorLauncher = getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="inspector"]');
    const jsonLauncher = getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="json"]');
    const itemListSection = app.querySelector<HTMLElement>(".item-list-section");
    const inspectorSection = app.querySelector<HTMLElement>(".inspector-section");
    const jsonSection = app.querySelector<HTMLElement>(".json-editor-section");

    if (!itemListSection || !inspectorSection || !jsonSection) {
      throw new Error("floating tab sections missing");
    }

    expect(itemListSection.closest('[data-panel-id="items"]')).toBe(getFloatingPanel(app, "items"));
    expect(inspectorSection.closest('[data-panel-id="inspector"]')).toBe(getFloatingPanel(app, "inspector"));
    expect(jsonSection.closest('[data-panel-id="json"]')).toBe(getFloatingPanel(app, "json"));

    getButton(getFloatingPanel(app, "json"), ".floating-panel-minimize").click();
    expect(getFloatingPanel(app, "json").hidden).toBe(true);

    inspectorLauncher.click();
    expect(inspectorLauncher.getAttribute("aria-pressed")).toBe("true");
    jsonLauncher.click();

    expect(jsonLauncher.getAttribute("aria-pressed")).toBe("true");
    expect(getFloatingPanel(app, "json").hidden).toBe(false);
    expect(jsonSection.closest('[data-panel-id="json"]')).toBe(getFloatingPanel(app, "json"));
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
    expect(app.querySelector<HTMLElement>(".inspector-status")?.textContent).toBe("Selected demo-component-a");
    expect(app.querySelector('[data-id="demo-component-a"]')?.getAttribute("data-editor-selected")).toBe("true");
  });

  it("keeps selection in the inspector until the JSON tab is opened manually", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const jsonInput = getTextarea(app, ".json-input");
    const jsonLauncher = getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="json"]');
    const jsonSection = app.querySelector<HTMLElement>(".json-editor-section");
    const alarmLabelButton = getButton(app, '[data-item-id="demo-alarm-label"]');

    expect(jsonSection?.hidden).toBe(false);

    alarmLabelButton.click();

    expect(getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="inspector"]').getAttribute("aria-pressed")).toBe("true");
    expect(jsonSection?.hidden).toBe(false);

    jsonLauncher.click();

    expect(jsonSection?.hidden).toBe(false);
    expect(jsonLauncher.getAttribute("aria-pressed")).toBe("true");
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
    const jsonLauncher = getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="json"]');
    const jsonSection = app.querySelector<HTMLElement>(".json-editor-section");
    const previewItem = app.querySelector('[data-id="demo-component-b"]');

    if (!previewItem) {
      throw new Error("preview item missing");
    }

    previewItem.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(jsonSection?.hidden).toBe(false);

    jsonLauncher.click();

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
    const jsonLauncher = getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="json"]');
    const previewItem = app.querySelector('[data-id="demo-component-b"]');

    if (!previewItem) {
      throw new Error("preview item missing");
    }

    jsonLauncher.click();
    jsonInput.setSelectionRange(0, 0);
    previewItem.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const selectedJson = jsonInput.value.slice(jsonInput.selectionStart, jsonInput.selectionEnd);

    expect(jsonLauncher.getAttribute("aria-pressed")).toBe("true");
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
    const symbolGridButton = getButton(app, ".symbol-grid-toggle-button");
    const gridSizeInput = getInput(app, ".grid-size-input");
    const symbolGridSizeInput = getInput(app, ".symbol-grid-size-input");

    expect(gridButton.getAttribute("aria-pressed")).toBe("true");
    expect(symbolGridButton.getAttribute("aria-pressed")).toBe("true");
    expect(app.querySelector('[data-editor-grid="true"]')?.getAttribute("data-grid-size")).toBe("10");

    gridSizeInput.value = "20";
    gridSizeInput.dispatchEvent(new Event("change"));
    expect(symbolGridSizeInput.value).toBe("20");
    expect(app.querySelector('[data-editor-grid="true"]')?.getAttribute("data-grid-size")).toBe("20");

    gridButton.click();

    expect(gridButton.getAttribute("aria-pressed")).toBe("false");
    expect(symbolGridButton.getAttribute("aria-pressed")).toBe("false");
    expect(gridButton.textContent).toBe("▦");
    expect(gridButton.getAttribute("aria-label")).toBe("Grid off");
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
    expect(getButton(app, ".pan-tool-button").textContent).toBe("✥");

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

  it("opens and closes import, SVG import, export, HA preview, and app theme panels from the sidebar", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const panel = app.querySelector<HTMLElement>(".transfer-panel");
    const appThemePanel = getFloatingPanel(app, "app-theme");
    const importSection = app.querySelector<HTMLElement>(".import-section");
    const svgImportSection = app.querySelector<HTMLElement>(".svg-import-section");
    const themeSection = app.querySelector<HTMLElement>(".theme-section");
    const exportSection = app.querySelector<HTMLElement>(".export-section");

    if (!panel || !importSection || !svgImportSection || !themeSection || !exportSection) {
      throw new Error("transfer panel missing");
    }

    expect(panel.hidden).toBe(true);
    expect(appThemePanel.hidden).toBe(true);

    getButton(app, '.editor-nav-entry[data-transfer-mode="import"]').click();
    expect(panel.hidden).toBe(false);
    expect(panel.dataset.mode).toBe("import");
    expect(importSection.hidden).toBe(false);
    expect(svgImportSection.hidden).toBe(true);
    expect(themeSection.hidden).toBe(true);
    expect(exportSection.hidden).toBe(true);

    getButton(app, '.editor-nav-entry[data-transfer-mode="svg"]').click();
    expect(panel.dataset.mode).toBe("svg");
    expect(importSection.hidden).toBe(true);
    expect(svgImportSection.hidden).toBe(false);
    expect(themeSection.hidden).toBe(true);
    expect(exportSection.hidden).toBe(true);

    getButton(app, '.editor-nav-entry[data-transfer-mode="export"]').click();
    expect(panel.dataset.mode).toBe("export");
    expect(importSection.hidden).toBe(true);
    expect(svgImportSection.hidden).toBe(true);
    expect(themeSection.hidden).toBe(true);
    expect(exportSection.hidden).toBe(false);

    getButton(app, '.editor-nav-entry[data-transfer-mode="theme"]').click();
    expect(panel.dataset.mode).toBe("theme");
    expect(importSection.hidden).toBe(true);
    expect(svgImportSection.hidden).toBe(true);
    expect(themeSection.hidden).toBe(false);
    expect(exportSection.hidden).toBe(true);

    getButton(app, '.editor-nav-entry[data-open-panel="app-theme"]').click();
    expect(appThemePanel.hidden).toBe(false);
    expect(appThemePanel.dataset.panelState).toBe("open");
    expect(app.querySelector<HTMLElement>(".theme-section")?.hidden).toBe(false);

    getButton(app, ".transfer-panel-close").click();
    expect(panel.hidden).toBe(true);
  });

  it("resizes floating panels with the bottom-right handle", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="json"]').click();
    const panel = getFloatingPanel(app, "json");
    const handle = panel.querySelector<HTMLElement>(".floating-panel-resize-handle");
    const layer = app.querySelector<HTMLElement>(".floating-panel-layer");

    if (!handle || !layer) {
      throw new Error("floating resize elements missing");
    }

    setElementBounds(layer, { left: 0, top: 0, width: 1200, height: 800 });
    setElementBounds(panel, { left: 720, top: 360, width: 420, height: 260 });
    Object.defineProperty(layer, "clientWidth", { configurable: true, value: 1200 });
    Object.defineProperty(layer, "clientHeight", { configurable: true, value: 800 });

    handle.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 1140, clientY: 620 }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 1188, clientY: 700 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    expect(panel.style.width).toBe("468px");
    expect(panel.style.height).toBe("340px");

    handle.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 1188, clientY: 700 }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 800, clientY: 300 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    expect(panel.style.width).toBe("260px");
    expect(panel.style.height).toBe("160px");
  });

  it("resizes floating panels from edges and corners", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="json"]').click();
    const panel = getFloatingPanel(app, "json");
    const layer = app.querySelector<HTMLElement>(".floating-panel-layer");

    if (!layer) {
      throw new Error("floating panel layer missing");
    }

    setElementBounds(layer, { left: 0, top: 0, width: 1200, height: 800 });
    setElementBounds(panel, { left: 720, top: 360, width: 420, height: 260 });
    Object.defineProperty(layer, "clientWidth", { configurable: true, value: 1200 });
    Object.defineProperty(layer, "clientHeight", { configurable: true, value: 800 });
    Object.defineProperty(panel, "offsetWidth", { configurable: true, value: 420 });
    Object.defineProperty(panel, "offsetHeight", { configurable: true, value: 260 });

    panel.dispatchEvent(new MouseEvent("mousedown", {
      bubbles: true,
      button: 0,
      clientX: 720,
      clientY: 360
    }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 700, clientY: 340 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    expect(panel.style.left).toBe("700px");
    expect(panel.style.top).toBe("340px");
    expect(panel.style.width).toBe("440px");
    expect(panel.style.height).toBe("280px");
  });

  it("resizes docked side panels and reflows the active workspace", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const layer = app.querySelector<HTMLElement>(".floating-panel-layer");
    const rightZone = app.querySelector<HTMLElement>('[data-dock-zone="right"]');

    if (!layer || !rightZone) {
      throw new Error("right dock zone missing");
    }

    setElementBounds(layer, { left: 0, top: 0, width: 1200, height: 800 });
    Object.defineProperty(layer, "clientWidth", { configurable: true, value: 1200 });
    Object.defineProperty(layer, "clientHeight", { configurable: true, value: 800 });

    getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="json"]').click();
    const panel = getFloatingPanel(app, "json");
    dockPanelByDrag(documentRef, layer, panel, { left: 720, top: 360, width: 420, height: 260 }, 1190, 240);

    expect(panel.dataset.panelState).toBe("docked");
    expect(panel.parentElement).toBe(rightZone);
    expect(rightZone.style.width).toBe("228px");
    expect(app.style.getPropertyValue("--workspace-right-dock-w")).toBe("228px");

    setElementBounds(rightZone, { left: 972, top: 0, width: 228, height: 800 });
    setElementBounds(panel, { left: 972, top: 0, width: 228, height: 800 });
    Object.defineProperty(panel, "offsetWidth", { configurable: true, value: 228 });
    Object.defineProperty(panel, "offsetHeight", { configurable: true, value: 800 });

    panel.dispatchEvent(new MouseEvent("mousedown", {
      bubbles: true,
      button: 0,
      clientX: 972,
      clientY: 220
    }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 700, clientY: 220 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    expect(rightZone.style.width).toBe("500px");
    expect(app.style.getPropertyValue("--workspace-right-dock-w")).toBe("500px");
  });

  it("uses a smaller default bottom dock that still reflows the workspace", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const layer = app.querySelector<HTMLElement>(".floating-panel-layer");
    const bottomZone = app.querySelector<HTMLElement>('[data-dock-zone="bottom"]');

    if (!layer || !bottomZone) {
      throw new Error("bottom dock zone missing");
    }

    setElementBounds(layer, { left: 0, top: 0, width: 1200, height: 800 });
    Object.defineProperty(layer, "clientWidth", { configurable: true, value: 1200 });
    Object.defineProperty(layer, "clientHeight", { configurable: true, value: 800 });

    getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="json"]').click();
    const panel = getFloatingPanel(app, "json");
    dockPanelByDrag(documentRef, layer, panel, { left: 720, top: 360, width: 420, height: 260 }, 600, 790);

    expect(panel.dataset.panelState).toBe("docked");
    expect(panel.parentElement).toBe(bottomZone);
    expect(bottomZone.style.height).toBe("224px");
    expect(app.style.getPropertyValue("--workspace-bottom-dock-h")).toBe("224px");
  });

  it("lets floating panels drag beyond the viewport before snap release", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const layer = app.querySelector<HTMLElement>(".floating-panel-layer");

    if (!layer) {
      throw new Error("floating panel layer missing");
    }

    setElementBounds(layer, { left: 0, top: 0, width: 1200, height: 800 });
    Object.defineProperty(layer, "clientWidth", { configurable: true, value: 1200 });
    Object.defineProperty(layer, "clientHeight", { configurable: true, value: 800 });

    getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="inspector"]').click();
    const panel = getFloatingPanel(app, "inspector");
    setElementBounds(panel, { left: 720, top: 18, width: 380, height: 320 });
    Object.defineProperty(panel, "offsetWidth", { configurable: true, value: 380 });
    Object.defineProperty(panel, "offsetHeight", { configurable: true, value: 320 });

    getPanelHeader(panel).dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 740, clientY: 38 }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: -80, clientY: -20 }));

    expect(panel.style.left).toBe("-100px");
    expect(panel.style.top).toBe("-40px");

    documentRef.dispatchEvent(new MouseEvent("mouseup", { clientX: 400, clientY: 400 }));
  });

  it("detaches docked panels during drag with immediate feedback", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const layer = app.querySelector<HTMLElement>(".floating-panel-layer");
    const leftZone = app.querySelector<HTMLElement>('[data-dock-zone="left"]');

    if (!layer || !leftZone) {
      throw new Error("left dock zone missing");
    }

    setElementBounds(layer, { left: 0, top: 0, width: 1200, height: 800 });
    Object.defineProperty(layer, "clientWidth", { configurable: true, value: 1200 });
    Object.defineProperty(layer, "clientHeight", { configurable: true, value: 800 });

    getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="items"]').click();
    const panel = getFloatingPanel(app, "items");
    dockPanelByDrag(documentRef, layer, panel, { left: 720, top: 360, width: 420, height: 260 }, 24, 240);
    setElementBounds(leftZone, { left: 0, top: 0, width: 456, height: 800 });
    setElementBounds(panel, { left: 0, top: 0, width: 456, height: 260 });
    Object.defineProperty(panel, "offsetWidth", { configurable: true, value: 456 });
    Object.defineProperty(panel, "offsetHeight", { configurable: true, value: 260 });

    getPanelHeader(panel).dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 20, clientY: 20 }));
    expect(panel.dataset.undockPreview).toBe("true");

    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 520, clientY: 180 }));

    expect(panel.dataset.panelState).toBe("open");
    expect(panel.dataset.detaching).toBe("true");
    expect(panel.parentElement?.classList.contains("floating-panels")).toBe(true);
    expect(app.style.getPropertyValue("--workspace-left-dock-w")).toBe("");

    documentRef.dispatchEvent(new MouseEvent("mouseup", { clientX: 520, clientY: 180 }));
  });

  it("shows one Odysseus-style snap ghost without competing dock-zone ghosts", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const layer = app.querySelector<HTMLElement>(".floating-panel-layer");

    if (!layer) {
      throw new Error("floating panel layer missing");
    }

    setElementBounds(layer, { left: 0, top: 0, width: 1200, height: 800 });
    Object.defineProperty(layer, "clientWidth", { configurable: true, value: 1200 });
    Object.defineProperty(layer, "clientHeight", { configurable: true, value: 800 });

    getButton(app, '.editor-nav-entry[data-editor-tab-shortcut="json"]').click();
    const panel = getFloatingPanel(app, "json");
    setElementBounds(panel, { left: 720, top: 360, width: 420, height: 260 });
    Object.defineProperty(panel, "offsetWidth", { configurable: true, value: 420 });
    Object.defineProperty(panel, "offsetHeight", { configurable: true, value: 260 });

    getPanelHeader(panel).dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 740, clientY: 380 }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX: 1190, clientY: 240 }));

    expect(app.querySelectorAll("#tile-ghost.visible").length).toBe(1);
    expect(app.querySelectorAll('.floating-panel-dock-zone[data-drop-target="true"]').length).toBe(0);

    documentRef.dispatchEvent(new MouseEvent("mouseup", { clientX: 1190, clientY: 240 }));
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

  it("applies editor app theme presets separately from HA preview theme variables", () => {
    const windowRef = new Window();
    const documentRef = windowRef.document as unknown as Document;
    const app = createEditorApp(documentRef);
    const themeInput = getTextarea(app, ".theme-input");
    const applyThemeButton = getButton(app, ".apply-theme-button");
    const previewSurface = app.querySelector<HTMLElement>(".preview-surface");
    const symbolPreviewSurface = app.querySelector<HTMLElement>(".symbol-preview-surface");

    if (!previewSurface || !symbolPreviewSurface) {
      throw new Error("preview surfaces missing");
    }

    getButton(app, '.editor-nav-entry[data-open-panel="app-theme"]').click();
    getButton(getFloatingPanel(app, "app-theme"), '[data-editor-theme-preset="paper"]').click();

    expect(documentRef.documentElement.dataset.editorTheme).toBe("paper");
    expect(app.dataset.editorTheme).toBe("paper");
    expect(documentRef.documentElement.style.getPropertyValue("--bg")).toBe("#faf8f5");
    expect(documentRef.documentElement.style.getPropertyValue("--primary-text-color")).toBe("");
    expect(app.dataset.previewTheme).toBe("default");
    expect(windowRef.localStorage.getItem("ha-schematic-card-editor-app-theme")).toBe("paper");
    expect(previewSurface.style.getPropertyValue("--ha-card-background")).toBe("");

    themeInput.value = JSON.stringify({
      type: "ha-schematic-card-theme-variables",
      version: 1,
      capturedAt: "2026-05-30T00:00:00.000Z",
      variables: {
        "--ha-card-background": "rgb(15, 16, 17)"
      }
    });
    applyThemeButton.click();
    expect(app.dataset.previewTheme).toBe("ha");
    expect(previewSurface.style.getPropertyValue("--ha-card-background")).toBe("rgb(15, 16, 17)");
    expect(symbolPreviewSurface.style.getPropertyValue("--ha-card-background")).toBe("rgb(15, 16, 17)");

    getButton(getFloatingPanel(app, "app-theme"), '[data-editor-theme-preset="terminal"]').click();
    expect(documentRef.documentElement.dataset.editorTheme).toBe("terminal");
    expect(documentRef.documentElement.style.getPropertyValue("--bg")).toBe("#000000");
    expect(documentRef.documentElement.style.getPropertyValue("--primary-text-color")).toBe("");
    expect(app.dataset.previewTheme).toBe("ha");
    expect(previewSurface.style.getPropertyValue("--ha-card-background")).toBe("rgb(15, 16, 17)");
    expect(symbolPreviewSurface.style.getPropertyValue("--ha-card-background")).toBe("rgb(15, 16, 17)");
  });

  it("loads stored editor app theme on startup", () => {
    const windowRef = new Window();
    const documentRef = windowRef.document as unknown as Document;

    windowRef.localStorage.setItem("ha-schematic-card-editor-app-theme", "claude");

    const app = createEditorApp(documentRef);

    expect(documentRef.documentElement.dataset.editorTheme).toBe("claude");
    expect(app.dataset.editorTheme).toBe("claude");
    expect(documentRef.documentElement.style.getPropertyValue("--bg")).toBe("#262624");
    expect(getFloatingPanel(app, "app-theme").querySelector<HTMLElement>(".app-theme-status")?.textContent).toBe(
      "Editor theme: Claude"
    );
  });

  it("applies pasted theme variables to the preview surface", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const themeInput = getTextarea(app, ".theme-input");
    const applyThemeButton = getButton(app, ".apply-theme-button");
    const themePreviewToggle = getInput(app, ".theme-preview-toggle");
    const previewSurface = app.querySelector<HTMLElement>(".preview-surface");
    const symbolPreviewSurface = app.querySelector<HTMLElement>(".symbol-preview-surface");
    const cardWorkspace = app.querySelector<HTMLElement>(".card-editor-workspace");
    const symbolWorkspace = app.querySelector<HTMLElement>(".symbol-editor-workspace");

    if (!previewSurface || !symbolPreviewSurface || !cardWorkspace || !symbolWorkspace) {
      throw new Error("preview targets missing");
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

    expect(app.dataset.previewTheme).toBe("ha");
    expect(cardWorkspace.style.getPropertyValue("--primary-text-color")).toBe("rgb(10, 20, 30)");
    expect(symbolWorkspace.style.getPropertyValue("--primary-text-color")).toBe("rgb(10, 20, 30)");
    expect(previewSurface.style.getPropertyValue("--primary-text-color")).toBe("rgb(10, 20, 30)");
    expect(previewSurface.style.getPropertyValue("--accent-color")).toBe("rgb(40, 50, 60)");
    expect(previewSurface.style.getPropertyValue("--ha-card-background")).toBe("rgb(5, 6, 7)");
    expect(symbolPreviewSurface.style.getPropertyValue("--primary-text-color")).toBe("rgb(10, 20, 30)");
    expect(symbolPreviewSurface.style.getPropertyValue("--accent-color")).toBe("rgb(40, 50, 60)");
    expect(symbolPreviewSurface.style.getPropertyValue("--ha-card-background")).toBe("rgb(5, 6, 7)");
    expect(themePreviewToggle.checked).toBe(true);
    expect(app.querySelector<HTMLElement>(".theme-status")?.textContent).toBe("Applied 3 HA preview variables");
  });

  it("chooses HA preview grid contrast from background brightness", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const themeInput = getTextarea(app, ".theme-input");
    const applyThemeButton = getButton(app, ".apply-theme-button");
    const previewTargets = [
      app.querySelector<HTMLElement>(".card-editor-workspace"),
      app.querySelector<HTMLElement>(".symbol-editor-workspace"),
      app.querySelector<HTMLElement>(".preview-surface"),
      app.querySelector<HTMLElement>(".symbol-preview-surface")
    ];

    if (previewTargets.some((target) => !target)) {
      throw new Error("preview targets missing");
    }

    themeInput.value = JSON.stringify({
      type: "ha-schematic-card-theme-variables",
      version: 1,
      capturedAt: "2026-05-30T00:00:00.000Z",
      variables: {
        "--ha-card-background": "rgb(248, 249, 250)",
        "--divider-color": "rgb(255, 255, 255)",
        "--primary-text-color": "rgb(255, 255, 255)",
        "--preview-workspace-grid": "rgb(255, 255, 255)"
      }
    });
    applyThemeButton.click();

    for (const target of previewTargets) {
      expect(target!.style.getPropertyValue("--preview-workspace-grid")).toBe("rgb(3 8 16 / 76%)");
    }

    themeInput.value = JSON.stringify({
      type: "ha-schematic-card-theme-variables",
      version: 1,
      capturedAt: "2026-05-30T00:00:00.000Z",
      variables: {
        "--ha-card-background": "var(--custom-dark-background, #050607)",
        "--custom-dark-background": "#050607",
        "--divider-color": "#000000",
        "--primary-text-color": "#000000",
        "--preview-workspace-grid": "#000000"
      }
    });
    applyThemeButton.click();

    for (const target of previewTargets) {
      expect(target!.style.getPropertyValue("--preview-workspace-grid")).toBe("rgb(244 248 255 / 78%)");
    }
  });

  it("toggles imported theme variables on and off for the preview surface", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const themeInput = getTextarea(app, ".theme-input");
    const applyThemeButton = getButton(app, ".apply-theme-button");
    const themePreviewToggle = getInput(app, ".theme-preview-toggle");
    const previewSurface = app.querySelector<HTMLElement>(".preview-surface");
    const symbolPreviewSurface = app.querySelector<HTMLElement>(".symbol-preview-surface");
    const cardWorkspace = app.querySelector<HTMLElement>(".card-editor-workspace");
    const symbolWorkspace = app.querySelector<HTMLElement>(".symbol-editor-workspace");

    if (!previewSurface || !symbolPreviewSurface || !cardWorkspace || !symbolWorkspace) {
      throw new Error("preview targets missing");
    }

    themeInput.value = JSON.stringify({
      type: "ha-schematic-card-theme-variables",
      version: 1,
      capturedAt: "2026-05-30T00:00:00.000Z",
      variables: {
        "--ha-card-background": "rgb(15, 16, 17)"
      }
    });
    applyThemeButton.click();
    expect(app.dataset.previewTheme).toBe("ha");
    expect(cardWorkspace.style.getPropertyValue("--ha-card-background")).toBe("rgb(15, 16, 17)");
    expect(symbolWorkspace.style.getPropertyValue("--ha-card-background")).toBe("rgb(15, 16, 17)");
    expect(previewSurface.style.getPropertyValue("--ha-card-background")).toBe("rgb(15, 16, 17)");
    expect(symbolPreviewSurface.style.getPropertyValue("--ha-card-background")).toBe("rgb(15, 16, 17)");

    themePreviewToggle.checked = false;
    themePreviewToggle.dispatchEvent(new Event("change"));
    expect(app.dataset.previewTheme).toBe("default");
    expect(cardWorkspace.style.getPropertyValue("--ha-card-background")).toBe("");
    expect(symbolWorkspace.style.getPropertyValue("--ha-card-background")).toBe("");
    expect(previewSurface.style.getPropertyValue("--ha-card-background")).toBe("");
    expect(symbolPreviewSurface.style.getPropertyValue("--ha-card-background")).toBe("");
    expect(app.querySelector<HTMLElement>(".theme-status")?.textContent).toBe("Using default preview surface");

    themePreviewToggle.checked = true;
    themePreviewToggle.dispatchEvent(new Event("change"));
    expect(app.dataset.previewTheme).toBe("ha");
    expect(previewSurface.style.getPropertyValue("--ha-card-background")).toBe("rgb(15, 16, 17)");
    expect(symbolPreviewSurface.style.getPropertyValue("--ha-card-background")).toBe("rgb(15, 16, 17)");
    expect(app.querySelector<HTMLElement>(".theme-status")?.textContent).toBe("Previewing 1 imported theme variables");
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
    const symbolPreviewSurface = app.querySelector<HTMLElement>(".symbol-preview-surface");

    expect(getTextarea(app, ".theme-input").value).toBe(storedTheme);
    expect(app.dataset.previewTheme).toBe("ha");
    expect(previewSurface?.style.getPropertyValue("--ha-card-background")).toBe("rgb(1, 2, 3)");
    expect(symbolPreviewSurface?.style.getPropertyValue("--ha-card-background")).toBe("rgb(1, 2, 3)");
    expect(app.querySelector<HTMLElement>(".theme-status")?.textContent).toBe("Applied 1 HA preview variables");
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

function getFloatingPanel(root: ParentNode, panelId: string): HTMLElement {
  const element = root.querySelector(`[data-panel-id="${panelId}"]`);

  if (!(element instanceof HTMLElement)) {
    throw new Error(`floating panel missing: ${panelId}`);
  }

  return element;
}

function getPanelHeader(panel: HTMLElement): HTMLElement {
  const header = panel.querySelector<HTMLElement>(".floating-panel-header");

  if (!header) {
    throw new Error("floating panel header missing");
  }

  return header;
}

function dockPanelByDrag(
  documentRef: Document,
  layer: HTMLElement,
  panel: HTMLElement,
  rect: { left: number; top: number; width: number; height: number },
  clientX: number,
  clientY: number
): void {
  setElementBounds(panel, rect);
  Object.defineProperty(panel, "offsetWidth", { configurable: true, value: rect.width });
  Object.defineProperty(panel, "offsetHeight", { configurable: true, value: rect.height });
  getPanelHeader(panel).dispatchEvent(new MouseEvent("mousedown", {
    bubbles: true,
    clientX: rect.left + 20,
    clientY: rect.top + 20
  }));
  documentRef.dispatchEvent(new MouseEvent("mousemove", { clientX, clientY }));
  documentRef.dispatchEvent(new MouseEvent("mouseup", { clientX, clientY }));
  layer.dataset.testLastDock = panel.dataset.dockZone ?? "";
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
  viewport?: { width: number; height: number };
  parts?: Array<{ id: string; label?: string }>;
  entitySlots?: Array<{ id: string; label?: string; valueType?: string; required?: boolean }>;
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

function getSymbolInstanceIds(app: HTMLElement): string[] {
  const parsed = JSON.parse(getTextarea(app, ".json-input").value) as {
    items: Array<{ type?: string; symbolId?: string }>;
  };
  return parsed.items
    .filter((item) => item.type === "symbol")
    .map((item) => item.symbolId ?? "");
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

function expectSvgViewBox(
  svg: SVGSVGElement,
  expected: Partial<{ x: number; y: number; width: number; height: number }>
): void {
  const values = svg.getAttribute("viewBox")?.trim().split(/\s+/).map(Number);

  if (!values || values.length !== 4) {
    throw new Error(`Invalid viewBox: ${svg.getAttribute("viewBox")}`);
  }

  const [x, y, width, height] = values;

  if (expected.x !== undefined) {
    expect(x).toBeCloseTo(expected.x);
  }

  if (expected.y !== undefined) {
    expect(y).toBeCloseTo(expected.y);
  }

  if (expected.width !== undefined) {
    expect(width).toBeCloseTo(expected.width);
  }

  if (expected.height !== undefined) {
    expect(height).toBeCloseTo(expected.height);
  }
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
