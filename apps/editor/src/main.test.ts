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
        "--accent-color": "rgb(40, 50, 60)"
      }
    });
    applyThemeButton.click();

    expect(previewSurface.style.getPropertyValue("--primary-text-color")).toBe("rgb(10, 20, 30)");
    expect(previewSurface.style.getPropertyValue("--accent-color")).toBe("rgb(40, 50, 60)");
    expect(app.querySelector<HTMLElement>(".theme-status")?.textContent).toBe("Applied 2 theme variables");
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
