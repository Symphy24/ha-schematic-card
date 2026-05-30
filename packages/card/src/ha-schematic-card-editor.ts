import { LitElement, css, html, nothing } from "lit";

import type { HaSchematicCardConfig } from "./types";

export const HA_SCHEMATIC_CARD_EDITOR_TAG = "ha-schematic-card-editor";

export const THEME_VARIABLES_TO_COPY = [
  "--primary-text-color",
  "--secondary-text-color",
  "--accent-color",
  "--divider-color",
  "--ha-card-background",
  "--card-background-color",
  "--primary-background-color",
  "--secondary-background-color",
  "--lovelace-background",
  "--primary-color",
  "--error-color",
  "--warning-color",
  "--success-color",
  "--paper-card-background-color",
  "--disabled-text-color",
  "--paper-font-body1_-_font-family",
  "--mdc-typography-body1-font-family"
] as const;

declare global {
  interface HTMLElementTagNameMap {
    "ha-schematic-card-editor": HaSchematicCardEditor;
  }
}

type ThemeCopyStatus = {
  kind: "success" | "error";
  message: string;
};

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
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      word-break: break-word;
      overflow-x: hidden;
    }

    .theme-json {
      min-height: 220px;
    }

    .helper {
      color: var(--secondary-text-color, #6b6b6b);
      font-size: 12px;
    }

    .warning {
      color: var(--warning-color, #b26a00);
    }

    .theme-tools {
      display: grid;
      gap: 8px;
      margin-top: 20px;
    }

    button {
      justify-self: start;
      padding: 8px 12px;
      border: 1px solid var(--divider-color, #d0d0d0);
      border-radius: 4px;
      color: var(--primary-text-color, #212121);
      background: var(--card-background-color, #ffffff);
      font: inherit;
      cursor: pointer;
    }

    .status-success {
      color: var(--success-color, #0b8043);
    }

    .status-error {
      color: var(--error-color, #b00020);
    }
  `;

  static override properties = {
    _config: { state: true },
    _themeCopyStatus: { state: true },
    _themeVariablesJson: { state: true }
  };

  declare private _config?: HaSchematicCardConfig;
  declare private _themeCopyStatus?: ThemeCopyStatus;
  declare private _themeVariablesJson?: string;

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
          wrap="soft"
          .value=${payload}
          @input=${this._handlePayloadInput}
        ></textarea>
        ${payloadHelper ? html`<div class=${payloadHelper.warning ? "helper warning" : "helper"}>${payloadHelper.text}</div>` : nothing}
      </div>

      <div class="theme-tools">
        <button type="button" @click=${this._handleCopyThemeVariables}>
          Copy current theme variables
        </button>
        <div class="helper">
          Copy selected Home Assistant theme variables as JSON for the future external editor preview.
        </div>
        ${this._themeCopyStatus ? html`
          <div class=${this._themeCopyStatus.kind === "success" ? "helper status-success" : "helper status-error"}>
            ${this._themeCopyStatus.message}
          </div>
        ` : nothing}
        ${this._themeVariablesJson ? html`
          <button type="button" @click=${this._handleSelectThemeVariablesJson}>
            Select JSON
          </button>
          <textarea
            class="theme-json"
            readonly
            spellcheck="false"
            wrap="soft"
            .value=${this._themeVariablesJson}
          ></textarea>
        ` : nothing}
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

  private async _handleCopyThemeVariables(): Promise<void> {
    const themeVariablesJson = createThemeVariablesJson(this);

    try {
      const clipboard = navigator.clipboard;

      if (!clipboard?.writeText) {
        this._themeVariablesJson = themeVariablesJson;
        this._themeCopyStatus = {
          kind: "error",
          message: "Clipboard access is unavailable. Select and copy the JSON manually."
        };
        return;
      }

      await clipboard.writeText(themeVariablesJson);

      this._themeVariablesJson = undefined;
      this._themeCopyStatus = {
        kind: "success",
        message: "Theme variables copied."
      };
    } catch {
      this._themeVariablesJson = themeVariablesJson;
      this._themeCopyStatus = {
        kind: "error",
        message: "Could not copy theme variables. Select and copy the JSON manually."
      };
    }
  }

  private _handleSelectThemeVariablesJson(): void {
    const textarea = this.renderRoot.querySelector<HTMLTextAreaElement>(".theme-json");
    textarea?.select();
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

function collectThemeVariables(element: HTMLElement): Record<string, string> {
  const documentElement = element.ownerDocument.documentElement;
  const elementStyle = getComputedStyle(element);
  const documentStyle = getComputedStyle(documentElement);
  const variables: Record<string, string> = {};

  for (const variableName of THEME_VARIABLES_TO_COPY) {
    const value = elementStyle.getPropertyValue(variableName).trim()
      || documentStyle.getPropertyValue(variableName).trim();

    if (value) {
      variables[variableName] = value;
    }
  }

  return variables;
}

function createThemeVariablesJson(element: HTMLElement): string {
  return JSON.stringify({
    type: "ha-schematic-card-theme-variables",
    version: 1,
    capturedAt: new Date().toISOString(),
    variables: collectThemeVariables(element)
  }, null, 2);
}
