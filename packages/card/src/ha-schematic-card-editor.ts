import { LitElement, css, html, nothing } from "lit";

import type { HaSchematicCardConfig } from "./types";

export const HA_SCHEMATIC_CARD_EDITOR_TAG = "ha-schematic-card-editor";

declare global {
  interface HTMLElementTagNameMap {
    "ha-schematic-card-editor": HaSchematicCardEditor;
  }
}

export class HaSchematicCardEditor extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .field {
      display: grid;
      gap: 6px;
      margin-bottom: 16px;
    }

    label {
      font-weight: 500;
    }

    input,
    textarea {
      box-sizing: border-box;
      width: 100%;
      padding: 8px;
      border: 1px solid var(--divider-color, #d0d0d0);
      border-radius: 4px;
      font: inherit;
      color: var(--primary-text-color, #212121);
      background: var(--card-background-color, #ffffff);
    }

    textarea {
      min-height: 180px;
      resize: vertical;
      font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
      line-height: 1.4;
      white-space: pre;
      overflow-wrap: normal;
      overflow-x: auto;
    }

    .helper {
      color: var(--secondary-text-color, #6b6b6b);
      font-size: 12px;
    }

    .warning {
      color: var(--warning-color, #b26a00);
    }
  `;

  static override properties = {
    _config: { state: true }
  };

  declare private _config?: HaSchematicCardConfig;

  setConfig(config: HaSchematicCardConfig): void {
    this._config = { ...config };
  }

  override render() {
    const title = this._config?.title ?? "";
    const payload = this._config?.payload ?? "";
    const payloadHelper = getPayloadHelper(payload);

    return html`
      <div class="field">
        <label for="title">Title</label>
        <input
          id="title"
          .value=${title}
          @input=${this._handleTitleInput}
        />
      </div>

      <div class="field">
        <label for="payload">Payload</label>
        <textarea
          id="payload"
          spellcheck="false"
          .value=${payload}
          @input=${this._handlePayloadInput}
        ></textarea>
        ${payloadHelper ? html`<div class=${payloadHelper.warning ? "helper warning" : "helper"}>${payloadHelper.text}</div>` : nothing}
      </div>
    `;
  }

  private _handleTitleInput(event: Event): void {
    this._updateConfig({
      title: getInputValue(event)
    });
  }

  private _handlePayloadInput(event: Event): void {
    this._updateConfig({
      payload: getInputValue(event)
    });
  }

  private _updateConfig(update: Partial<HaSchematicCardConfig>): void {
    const config = {
      ...this._config,
      ...update
    };

    this._config = config;
    this.dispatchEvent(new CustomEvent("config-changed", {
      bubbles: true,
      composed: true,
      detail: {
        config
      }
    }));
  }
}

export function registerHaSchematicCardEditor(
  registry: CustomElementRegistry | undefined = globalThis.customElements
): void {
  if (registry && !registry.get(HA_SCHEMATIC_CARD_EDITOR_TAG)) {
    registry.define(HA_SCHEMATIC_CARD_EDITOR_TAG, HaSchematicCardEditor);
  }
}

registerHaSchematicCardEditor();

function getInputValue(event: Event): string {
  return event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement
    ? event.target.value
    : "";
}

function getPayloadHelper(payload: string): { text: string; warning: boolean } {
  if (payload.trim().length === 0) {
    return {
      text: "Paste an exported hsc1 payload here.",
      warning: false
    };
  }

  if (!payload.trim().startsWith("hsc1.")) {
    return {
      text: "Payload should start with hsc1.",
      warning: true
    };
  }

  return {
    text: "Payload starts with hsc1.",
    warning: false
  };
}
