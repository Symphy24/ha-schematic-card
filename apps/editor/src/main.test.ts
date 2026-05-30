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
    const sectionResizeHandle = app.querySelector<HTMLElement>(".section-resize-handle");
    const itemToggle = getSubsectionToggle(app, "Items / Inspector");
    const jsonToggle = getSubsectionToggle(app, "Decoded JSON");

    if (!itemTools || !sectionResizeHandle) {
      throw new Error("item tools missing");
    }

    itemToggle.click();
    expect(itemToggle.getAttribute("aria-expanded")).toBe("false");
    expect(itemToggle.querySelector(".subsection-icon")?.textContent).toBe("vv");
    expect(itemTools.hidden).toBe(true);
    expect(sectionResizeHandle.hidden).toBe(true);

    itemToggle.click();
    expect(itemToggle.getAttribute("aria-expanded")).toBe("true");
    expect(itemTools.hidden).toBe(false);
    expect(sectionResizeHandle.hidden).toBe(false);

    jsonToggle.click();
    expect(jsonToggle.getAttribute("aria-expanded")).toBe("false");
    expect(jsonInput.hidden).toBe(true);
    expect(sectionResizeHandle.hidden).toBe(true);
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

  it("edits rect, circle, and polyline style fields", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);

    getButton(app, ".add-rect-button").click();
    getInspectorInput(app, "strokeWidth").value = "5";
    getInspectorInput(app, "strokeWidth").dispatchEvent(new Event("change"));
    expect(getPayloadItem(app, "rect-1")?.style?.strokeWidth).toBe(5);
    expect(app.querySelector('[data-id="rect-1"]')?.getAttribute("stroke-width")).toBe("5");

    getButton(app, '[data-item-id="demo-status-dot"]').click();
    getInspectorInput(app, "opacity").value = "0.5";
    getInspectorInput(app, "opacity").dispatchEvent(new Event("change"));
    expect(getPayloadItem(app, "demo-status-dot")?.style?.opacity).toBe(0.5);
    expect(app.querySelector('[data-id="demo-status-dot"]')?.getAttribute("opacity")).toBe("0.5");

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

    expect(getTextarea(app, ".json-input").value).toContain("\"x\": 80");
    expect(getTextarea(app, ".json-input").value).toContain("\"y\": 10");
    expect(movedHandle?.getAttribute("cx")).toBe("80");
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
    expect(getButton(app, ".add-polyline-point-button").hidden).toBe(true);
    expect(getButton(app, ".delete-polyline-point-button").hidden).toBe(true);
    expect(getButton(app, '[data-item-id="demo-title"]').getAttribute("aria-pressed")).toBe("true");
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

  it("resizes the item tools and decoded JSON sections vertically", () => {
    const documentRef = createDocument();
    const app = createEditorApp(documentRef);
    const pane = app.querySelector<HTMLElement>(".pane");
    const paneHeader = app.querySelector<HTMLElement>(".pane-header");
    const handle = app.querySelector<HTMLElement>(".section-resize-handle");

    if (!pane || !paneHeader || !handle) {
      throw new Error("section resize handle missing");
    }

    setElementBounds(pane, { left: 0, top: 0, width: 420, height: 800 });
    Object.defineProperty(pane, "clientHeight", {
      configurable: true,
      value: 800
    });
    setElementBounds(paneHeader, { left: 0, top: 0, width: 420, height: 52 });

    handle.dispatchEvent(new MouseEvent("mousedown", { clientY: 520, bubbles: true }));
    documentRef.dispatchEvent(new MouseEvent("mousemove", { clientY: 560 }));
    documentRef.dispatchEvent(new MouseEvent("mouseup"));

    expect(pane.style.getPropertyValue("--editor-json-height")).toBe("240px");
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
): { id: string; layer: number; style?: Record<string, unknown> } | undefined {
  const parsed = JSON.parse(getTextarea(app, ".json-input").value) as {
    items: Array<{ id: string; layer: number; style?: Record<string, unknown> }>;
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
