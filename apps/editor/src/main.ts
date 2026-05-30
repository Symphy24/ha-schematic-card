import { decodePayload, encodePayload } from "@ha-schematic-card/codec";
import { renderSchematicSvg } from "@ha-schematic-card/renderer";
import {
  isSchematicPayload,
  type SchematicPayload,
  validateSchematicPayload
} from "@ha-schematic-card/schema";

import demoPayloadJson from "../../../examples/demo-payloads/minimal.json";

const demoPayload = demoPayloadJson as SchematicPayload;

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
  jsonInput: HTMLTextAreaElement;
  previewSurface: HTMLElement;
  importInput: HTMLTextAreaElement;
  exportOutput: HTMLTextAreaElement;
  status: HTMLElement;
  copyButton: HTMLButtonElement;
  importButton: HTMLButtonElement;
  formatButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
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

  const jsonPane = createJsonPane(documentRef);
  const previewPane = createPane(documentRef, "Preview");
  const exportPane = createExportPane(documentRef);

  const elements: EditorElements = {
    jsonInput: getRequiredElement(jsonPane, ".json-input", HTMLTextAreaElement),
    previewSurface: createPreviewSurface(documentRef),
    importInput: getRequiredElement(exportPane, ".import-input", HTMLTextAreaElement),
    exportOutput: getRequiredElement(exportPane, ".payload-output", HTMLTextAreaElement),
    status: getRequiredElement(exportPane, ".status", HTMLElement),
    copyButton: getRequiredElement(exportPane, ".copy-button", HTMLButtonElement),
    importButton: getRequiredElement(exportPane, ".import-button", HTMLButtonElement),
    formatButton: getRequiredElement(jsonPane, ".format-button", HTMLButtonElement),
    resetButton: getRequiredElement(jsonPane, ".reset-button", HTMLButtonElement)
  };

  previewPane.append(elements.previewSurface);
  elements.jsonInput.value = formatPayloadJson();
  elements.jsonInput.addEventListener("input", () => updateFromJson(elements, documentRef));
  elements.copyButton.addEventListener("click", async () => copyExportedPayload(elements));
  elements.importButton.addEventListener("click", () => importEncodedPayload(elements, documentRef));
  elements.formatButton.addEventListener("click", () => formatCurrentJson(elements, documentRef));
  elements.resetButton.addEventListener("click", () => resetDemoPayload(elements, documentRef));

  shell.append(jsonPane, previewPane, exportPane);
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
    elements.status.textContent = result.message;
    elements.status.dataset.state = "error";
    return;
  }

  elements.previewSurface.append(renderSchematicSvg(result.payload, {
    document: documentRef,
    entityStates: demoEntityStates
  }));
  elements.exportOutput.value = encodePayload(result.payload);
  elements.status.textContent = "Valid payload";
  elements.status.dataset.state = "valid";
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
  elements.jsonInput.value = formatPayloadJson();
  updateFromJson(elements, documentRef);
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

  controls.append(formatButton, resetButton);
  pane.querySelector(".pane-header")?.append(controls);
  pane.append(jsonInput);
  return pane;
}

function createExportPane(documentRef: Document): HTMLElement {
  const pane = createPane(documentRef, "Export");
  const controls = documentRef.createElement("div");
  controls.className = "export-controls";

  const status = documentRef.createElement("span");
  status.className = "status";
  status.textContent = "Ready";

  const copyButton = documentRef.createElement("button");
  copyButton.className = "copy-button";
  copyButton.type = "button";
  copyButton.textContent = "Copy";

  const payloadOutput = documentRef.createElement("textarea");
  payloadOutput.className = "payload-output";
  payloadOutput.readOnly = true;
  payloadOutput.wrap = "soft";

  controls.append(status, copyButton);
  pane.querySelector(".pane-header")?.append(controls);

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

  importSection.append(importLabel, importInput, importButton);
  pane.append(importSection, payloadOutput);
  return pane;
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
