import { beforeEach, describe, expect, it } from "vitest";

import {
  HA_SCHEMATIC_CARD_EDITOR_TAG,
  HaSchematicCardEditor
} from "./ha-schematic-card-editor";
import { HA_SCHEMATIC_CARD_TAG, HaSchematicCard } from "./ha-schematic-card";

describe("ha-schematic-card-editor", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("can be defined as a custom element", () => {
    expect(customElements.get(HA_SCHEMATIC_CARD_EDITOR_TAG)).toBe(HaSchematicCardEditor);
  });

  it("is returned by the card config element factory", () => {
    const editor = HaSchematicCard.getConfigElement();

    expect(editor.tagName.toLowerCase()).toBe(HA_SCHEMATIC_CARD_EDITOR_TAG);
  });

  it("stores existing title and payload from setConfig", async () => {
    const editor = createEditor();

    editor.setConfig({
      type: `custom:${HA_SCHEMATIC_CARD_TAG}`,
      title: "Demo",
      payload: "hsc1.demo"
    });
    await editor.updateComplete;

    expect(getInput(editor, "title").value).toBe("Demo");
    expect(getTextarea(editor, "payload").value).toBe("hsc1.demo");
  });

  it("dispatches title changes while preserving payload", async () => {
    const editor = createEditor();
    const events: CustomEvent[] = [];
    editor.addEventListener("config-changed", (event) => events.push(event as CustomEvent));

    editor.setConfig({
      type: `custom:${HA_SCHEMATIC_CARD_TAG}`,
      title: "Old",
      payload: "hsc1.demo"
    });
    await editor.updateComplete;

    const title = getInput(editor, "title");
    title.value = "New";
    title.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      composed: true
    }));

    expect(events.at(-1)?.detail.config).toEqual({
      type: `custom:${HA_SCHEMATIC_CARD_TAG}`,
      title: "New",
      payload: "hsc1.demo"
    });
  });

  it("dispatches payload changes while preserving title", async () => {
    const editor = createEditor();
    const events: CustomEvent[] = [];
    editor.addEventListener("config-changed", (event) => events.push(event as CustomEvent));

    editor.setConfig({
      title: "Demo",
      payload: "hsc1.old"
    });
    await editor.updateComplete;

    const payload = getTextarea(editor, "payload");
    payload.value = "hsc1.new";
    payload.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      composed: true
    }));

    expect(events.at(-1)?.detail.config).toEqual({
      title: "Demo",
      payload: "hsc1.new"
    });
  });

  it("renders empty payload helper text without throwing", async () => {
    const editor = createEditor();

    expect(() => editor.setConfig({
      title: "Demo",
      payload: ""
    })).not.toThrow();
    await editor.updateComplete;

    expect(editor.shadowRoot?.textContent).toContain("Paste an exported hsc1 payload here.");
  });

  it("renders a warning helper when payload does not start with hsc1", async () => {
    const editor = createEditor();

    editor.setConfig({
      title: "Demo",
      payload: "not-hsc1"
    });
    await editor.updateComplete;

    const warning = editor.shadowRoot?.querySelector(".warning");

    expect(warning?.textContent).toContain("Payload should start with hsc1.");
  });
});

function createEditor(): HaSchematicCardEditor {
  const editor = document.createElement(HA_SCHEMATIC_CARD_EDITOR_TAG) as HaSchematicCardEditor;
  document.body.append(editor);
  return editor;
}

function getInput(editor: HaSchematicCardEditor, id: string): HTMLInputElement {
  const input = editor.shadowRoot?.querySelector<HTMLInputElement>(`#${id}`);

  if (!input) {
    throw new Error(`Missing input ${id}`);
  }

  return input;
}

function getTextarea(editor: HaSchematicCardEditor, id: string): HTMLTextAreaElement {
  const textarea = editor.shadowRoot?.querySelector<HTMLTextAreaElement>(`#${id}`);

  if (!textarea) {
    throw new Error(`Missing textarea ${id}`);
  }

  return textarea;
}
