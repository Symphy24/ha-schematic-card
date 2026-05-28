import { beforeEach, describe, expect, it, vi } from "vitest";

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

  it("soft-wraps long payload text without changing the value", async () => {
    const editor = createEditor();
    const events: CustomEvent[] = [];
    const longPayload = `hsc1.${"abcdef0123456789".repeat(20)}`;
    editor.addEventListener("config-changed", (event) => events.push(event as CustomEvent));

    editor.setConfig({
      title: "Demo",
      payload: ""
    });
    await editor.updateComplete;

    const payload = getTextarea(editor, "payload");
    payload.value = longPayload;
    payload.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      composed: true
    }));

    expect(payload.getAttribute("wrap")).toBe("soft");
    expect(events.at(-1)?.detail.config.payload).toBe(longPayload);
    expect(events.at(-1)?.detail.config.payload).not.toContain("\n");
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

  it("renders a copy theme variables button", async () => {
    const editor = createEditor();

    editor.setConfig({
      title: "Demo",
      payload: ""
    });
    await editor.updateComplete;

    expect(getButton(editor).textContent).toContain("Copy current theme variables");
  });

  it("copies selected theme variables as JSON", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const editor = createEditor();
    editor.style.setProperty("--primary-text-color", "rgb(1, 2, 3)");
    mockClipboard(writeText);

    editor.setConfig({
      title: "Demo",
      payload: ""
    });
    await editor.updateComplete;

    getButton(editor).click();
    await Promise.resolve();
    await editor.updateComplete;

    expect(writeText).toHaveBeenCalledOnce();

    const copied = JSON.parse(writeText.mock.calls[0]?.[0] as string);
    expect(copied.type).toBe("ha-schematic-card-theme-variables");
    expect(copied.version).toBe(1);
    expect(typeof copied.capturedAt).toBe("string");
    expect(copied.variables["--primary-text-color"]).toBe("rgb(1, 2, 3)");
    expect(editor.shadowRoot?.textContent).toContain("Theme variables copied.");
    expect(getThemeJsonTextarea(editor)).toBeNull();
  });

  it("renders manual JSON fallback when clipboard is unavailable", async () => {
    const editor = createEditor();
    const events: CustomEvent[] = [];
    editor.style.setProperty("--primary-text-color", "rgb(4, 5, 6)");
    editor.addEventListener("config-changed", (event) => events.push(event as CustomEvent));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined
    });

    editor.setConfig({
      title: "Demo",
      payload: ""
    });
    await editor.updateComplete;

    getButton(editor).click();
    await editor.updateComplete;

    const fallback = getThemeJsonTextarea(editor);
    const copied = JSON.parse(fallback?.value ?? "");

    expect(fallback?.readOnly).toBe(true);
    expect(fallback?.getAttribute("wrap")).toBe("soft");
    expect(copied.type).toBe("ha-schematic-card-theme-variables");
    expect(copied.version).toBe(1);
    expect(typeof copied.capturedAt).toBe("string");
    expect(copied.variables["--primary-text-color"]).toBe("rgb(4, 5, 6)");
    expect(events).toEqual([]);
    expect(editor.shadowRoot?.textContent).toContain("Select and copy the JSON manually.");
  });

  it("renders manual JSON fallback when copying theme variables fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    const editor = createEditor();
    mockClipboard(writeText);

    editor.setConfig({
      title: "Demo",
      payload: ""
    });
    await editor.updateComplete;

    getButton(editor).click();
    await Promise.resolve();
    await editor.updateComplete;

    expect(writeText).toHaveBeenCalledOnce();
    expect(JSON.parse(getThemeJsonTextarea(editor)?.value ?? "").type).toBe("ha-schematic-card-theme-variables");
    expect(editor.shadowRoot?.textContent).toContain("Could not copy theme variables.");
  });

  it("selects fallback JSON when requested", async () => {
    const editor = createEditor();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined
    });

    editor.setConfig({
      title: "Demo",
      payload: ""
    });
    await editor.updateComplete;

    getButton(editor).click();
    await editor.updateComplete;

    const fallback = getThemeJsonTextarea(editor);
    const select = vi.spyOn(fallback as HTMLTextAreaElement, "select");

    getButton(editor, "Select JSON").click();

    expect(select).toHaveBeenCalledOnce();
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

function getButton(editor: HaSchematicCardEditor, text = "Copy current theme variables"): HTMLButtonElement {
  const button = Array.from(editor.shadowRoot?.querySelectorAll<HTMLButtonElement>("button") ?? [])
    .find((candidate) => candidate.textContent?.includes(text));

  if (!button) {
    throw new Error(`Missing button ${text}`);
  }

  return button;
}

function getThemeJsonTextarea(editor: HaSchematicCardEditor): HTMLTextAreaElement | null {
  return editor.shadowRoot?.querySelector<HTMLTextAreaElement>(".theme-json") ?? null;
}

function mockClipboard(writeText: (value: string) => Promise<void>): void {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText
    }
  });
}
