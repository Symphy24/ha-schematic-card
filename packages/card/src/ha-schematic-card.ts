import { LitElement, css, html, nothing } from "lit";

import { decodePayload } from "@ha-schematic-card/codec";
import type { EntityStateValue } from "@ha-schematic-card/renderer";
import { renderSchematicSvg } from "@ha-schematic-card/renderer";
import type { SchematicPayload } from "@ha-schematic-card/schema";
import { HA_SCHEMATIC_CARD_EDITOR_TAG } from "./ha-schematic-card-editor";
import type { HaSchematicCardConfig, HomeAssistant } from "./types";
import "./ha-schematic-card-editor";

export const HA_SCHEMATIC_CARD_TAG = "ha-schematic-card";

type CustomCardMetadata = {
  type: string;
  name: string;
  description: string;
};

declare global {
  interface HTMLElementTagNameMap {
    "ha-schematic-card": HaSchematicCard;
  }

  interface Window {
    customCards?: CustomCardMetadata[];
  }
}

export class HaSchematicCard extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
    }

    ha-card,
    .card {
      display: block;
      width: 100%;
      overflow: hidden;
    }

    .title {
      padding: 16px 16px 0;
      font-size: 16px;
      font-weight: 500;
    }

    .content {
      padding: 16px;
    }

    .error {
      color: var(--error-color, #b00020);
      white-space: pre-wrap;
    }

    .svg-container {
      display: block;
      width: 100%;
      min-height: var(--ha-schematic-card-min-height, 320px);
      overflow: hidden;
    }

    .svg-container svg {
      display: block;
      width: 100%;
      max-width: 100%;
      height: auto;
    }
  `;

  static override properties = {
    hass: { attribute: false },
    _config: { state: true },
    _error: { state: true },
    _payload: { state: true }
  };

  declare hass?: HomeAssistant;

  declare private _config?: HaSchematicCardConfig;
  declare private _error?: string;
  declare private _payload?: SchematicPayload;

  static getStubConfig(): HaSchematicCardConfig {
    return {
      title: "Schematic",
      payload: ""
    };
  }

  static getConfigElement(): HTMLElement {
    return document.createElement(HA_SCHEMATIC_CARD_EDITOR_TAG);
  }

  setConfig(config: unknown): void {
    this._config = undefined;
    this._payload = undefined;
    this._error = undefined;

    if (!isRecord(config)) {
      this._error = "Invalid config: expected an object.";
      return;
    }

    const cardConfig: HaSchematicCardConfig = {
      type: typeof config.type === "string" ? config.type : "custom:ha-schematic-card",
      payload: typeof config.payload === "string" ? config.payload : undefined,
      title: typeof config.title === "string" ? config.title : undefined
    };

    this._config = cardConfig;

    if (!cardConfig.payload || cardConfig.payload.trim().length === 0) {
      this._error = "Missing payload.";
      return;
    }

    const decoded = decodePayload(cardConfig.payload);
    if (!decoded.ok) {
      this._error = `Invalid payload: ${decoded.errors.join("; ")}`;
      return;
    }

    this._payload = decoded.payload;
  }

  override updated(): void {
    this._renderSvg();
  }

  override render() {
    const title = this._config?.title;

    return html`
      <ha-card class="card">
        ${title ? html`<div class="title">${title}</div>` : nothing}
        <div class="content">
          ${this._error ? html`<div class="error" role="alert">${this._error}</div>` : nothing}
          <div class="svg-container"></div>
        </div>
      </ha-card>
    `;
  }

  private _renderSvg(): void {
    const container = this.renderRoot.querySelector(".svg-container");

    if (!(container instanceof Element)) {
      return;
    }

    container.replaceChildren();

    if (!this._payload || this._error) {
      return;
    }

    try {
      container.append(renderSchematicSvg(this._payload, {
        document: this.ownerDocument,
        entityStates: this._getEntityStates()
      }));
    } catch (error) {
      this._error = `Render failed: ${error instanceof Error ? error.message : String(error)}`;
      this.requestUpdate();
    }
  }

  private _getEntityStates(): Record<string, EntityStateValue> {
    const states = this.hass?.states ?? {};
    const entityStates: Record<string, EntityStateValue> = {};

    for (const [entityId, state] of Object.entries(states)) {
      entityStates[entityId] = {
        state: state.state,
        attributes: state.attributes
      };
    }

    return entityStates;
  }
}

export function registerHaSchematicCard(registry: CustomElementRegistry | undefined = globalThis.customElements): void {
  if (registry && !registry.get(HA_SCHEMATIC_CARD_TAG)) {
    registry.define(HA_SCHEMATIC_CARD_TAG, HaSchematicCard);
  }
}

registerHaSchematicCard();

if (typeof window !== "undefined") {
  window.customCards ??= [];

  if (!window.customCards.some((card) => card.type === HA_SCHEMATIC_CARD_TAG)) {
    window.customCards.push({
      type: HA_SCHEMATIC_CARD_TAG,
      name: "HA Schematic Card",
      description: "Generic SD/SCADA-like schematic card"
    });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
