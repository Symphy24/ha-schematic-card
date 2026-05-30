import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";

import {
  createEditorApp,
  encodeDemoPayload,
  formatPayloadJson,
  getDemoPayload
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

    expect(app.querySelector<HTMLTextAreaElement>(".json-input")?.value).toBe(formatPayloadJson());
    expect(app.querySelector("svg")).not.toBeNull();
    expect(app.querySelector('[data-editor-grid="true"]')).not.toBeNull();
    expect(app.querySelector<HTMLTextAreaElement>(".payload-output")?.value.startsWith("hsc1.")).toBe(true);
    expect(app.querySelector<HTMLElement>(".status")?.textContent).toBe("Valid payload");
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
    getInspectorInput(app, "text").value = "Edited Demo";
    getInspectorInput(app, "text").dispatchEvent(new Event("change"));

    expect(getTextarea(app, ".json-input").value).toContain("\"text\": \"Edited Demo\"");
    expect(app.querySelector("svg")?.textContent).toContain("Edited Demo");
    expect(app.querySelector<HTMLTextAreaElement>(".payload-output")?.value.startsWith("hsc1.")).toBe(true);
  });

  it("collapses and expands the item tools and JSON editor sections", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const itemTools = app.querySelector<HTMLElement>(".item-tools");
    const jsonInput = getTextarea(app, ".json-input");
    const itemToggle = getSubsectionToggle(app, "Items / Inspector");
    const jsonToggle = getSubsectionToggle(app, "Decoded JSON");

    if (!itemTools) {
      throw new Error("item tools missing");
    }

    itemToggle.click();
    expect(itemToggle.getAttribute("aria-expanded")).toBe("false");
    expect(itemToggle.querySelector(".subsection-icon")?.textContent).toBe("vv");
    expect(itemTools.hidden).toBe(true);

    itemToggle.click();
    expect(itemToggle.getAttribute("aria-expanded")).toBe("true");
    expect(itemTools.hidden).toBe(false);

    jsonToggle.click();
    expect(jsonToggle.getAttribute("aria-expanded")).toBe("false");
    expect(jsonInput.hidden).toBe(true);
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
    expect(previewItem.getAttribute("data-editor-selected")).toBe("true");
  });

  it("jumps to the selected item in JSON when selecting from the item list", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const jsonInput = getTextarea(app, ".json-input");
    const jsonToggle = getSubsectionToggle(app, "Decoded JSON");
    const alarmLabelButton = getButton(app, '[data-item-id="demo-alarm-label"]');

    jsonToggle.click();
    expect(jsonInput.hidden).toBe(true);

    alarmLabelButton.click();

    expect(jsonInput.hidden).toBe(false);
    expect(jsonToggle.getAttribute("aria-expanded")).toBe("true");
    expect(jsonInput.selectionStart).toBe(jsonInput.value.indexOf("\"id\": \"demo-alarm-label\"", jsonInput.value.indexOf("\"items\": [")));
    expect(jsonInput.scrollTop).toBeGreaterThan(0);
  });

  it("jumps to the selected item in JSON when selecting from the preview", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const jsonInput = getTextarea(app, ".json-input");
    const previewItem = app.querySelector('[data-id="demo-component-b"]');

    if (!previewItem) {
      throw new Error("preview item missing");
    }

    previewItem.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(jsonInput.selectionStart).toBe(jsonInput.value.indexOf("\"id\": \"demo-component-b\"", jsonInput.value.indexOf("\"items\": [")));
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
    expect(symbol?.getAttribute("data-editor-selected")).toBe("true");
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

  it("opens and closes the import/export side panel from the preview header", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const panel = app.querySelector<HTMLElement>(".transfer-panel");
    const importSection = app.querySelector<HTMLElement>(".import-section");
    const exportSection = app.querySelector<HTMLElement>(".export-section");

    if (!panel || !importSection || !exportSection) {
      throw new Error("transfer panel missing");
    }

    expect(panel.hidden).toBe(true);

    getButton(app, ".open-import-button").click();
    expect(panel.hidden).toBe(false);
    expect(panel.dataset.mode).toBe("import");
    expect(importSection.hidden).toBe(false);
    expect(exportSection.hidden).toBe(true);

    getButton(app, ".open-export-button").click();
    expect(panel.dataset.mode).toBe("export");
    expect(importSection.hidden).toBe(true);
    expect(exportSection.hidden).toBe(false);

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

function getSubsectionToggle(root: ParentNode, title: string): HTMLButtonElement {
  for (const button of root.querySelectorAll(".subsection-toggle")) {
    if (button instanceof HTMLButtonElement && button.textContent?.includes(title)) {
      return button;
    }
  }

  throw new Error(`subsection toggle missing: ${title}`);
}

function getInspectorInput(root: ParentNode, fieldName: string): HTMLInputElement {
  for (const field of root.querySelectorAll(".inspector-field")) {
    const label = field.querySelector(".field-label");
    const input = field.querySelector("input");

    if (label?.textContent === fieldName && input instanceof HTMLInputElement) {
      return input;
    }
  }

  throw new Error(`inspector input missing: ${fieldName}`);
}

function setSvgBounds(
  svg: SVGSVGElement,
  rect: { left: number; top: number; width: number; height: number }
): void {
  Object.defineProperty(svg, "getBoundingClientRect", {
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
