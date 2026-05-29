import { encodePayload } from "@ha-schematic-card/codec";
import { renderSchematicSvg } from "@ha-schematic-card/renderer";
import type { SchematicPayload } from "@ha-schematic-card/schema";

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

export function getDemoPayload(): SchematicPayload {
  return demoPayload;
}

export function encodeDemoPayload(payload: SchematicPayload = demoPayload): string {
  return encodePayload(payload);
}

export function createEditorApp(documentRef: Document = document): HTMLElement {
  const shell = documentRef.createElement("section");
  shell.className = "editor-shell";

  const previewPane = createPane(documentRef, "Preview");
  const previewSurface = documentRef.createElement("div");
  previewSurface.className = "preview-surface";
  previewSurface.append(renderSchematicSvg(demoPayload, {
    document: documentRef,
    entityStates: demoEntityStates
  }));
  previewPane.append(previewSurface);

  const exportPane = createPane(documentRef, "Export");
  const status = exportPane.querySelector<HTMLElement>(".status");
  const copyButton = exportPane.querySelector<HTMLButtonElement>(".copy-button");
  const payloadOutput = documentRef.createElement("textarea");
  const encodedPayload = encodeDemoPayload();

  payloadOutput.className = "payload-output";
  payloadOutput.readOnly = true;
  payloadOutput.wrap = "soft";
  payloadOutput.value = encodedPayload;
  exportPane.append(payloadOutput);

  copyButton?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(encodedPayload);
      if (status) {
        status.textContent = "Copied";
      }
    } catch {
      payloadOutput.focus();
      payloadOutput.select();
      if (status) {
        status.textContent = "Select and copy";
      }
    }
  });

  shell.append(previewPane, exportPane);
  return shell;
}

export function mountEditorApp(root: HTMLElement | null = document.getElementById("app")): void {
  if (!root) {
    return;
  }

  root.replaceChildren(createEditorApp(root.ownerDocument));
}

function createPane(documentRef: Document, title: string): HTMLElement {
  const pane = documentRef.createElement("section");
  pane.className = title === "Preview" ? "preview-pane" : "export-pane";

  const header = documentRef.createElement("div");
  header.className = "pane-header";

  const heading = documentRef.createElement("h1");
  heading.className = "pane-title";
  heading.textContent = title;
  header.append(heading);

  if (title === "Export") {
    const controls = documentRef.createElement("div");
    controls.className = "export-controls";

    const status = documentRef.createElement("span");
    status.className = "status";
    status.textContent = "Ready";

    const copyButton = documentRef.createElement("button");
    copyButton.className = "copy-button";
    copyButton.type = "button";
    copyButton.textContent = "Copy";

    controls.append(status, copyButton);
    header.append(controls);
  }

  pane.append(header);
  return pane;
}

mountEditorApp();
