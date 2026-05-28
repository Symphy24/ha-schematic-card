import { beforeEach, describe, expect, it } from "vitest";

import { encodePayload } from "@ha-schematic-card/codec";
import { HSC_SCHEMA_VERSION, type SchematicPayload } from "@ha-schematic-card/schema";

import {
  HA_SCHEMATIC_CARD_TAG,
  HaSchematicCard
} from "./ha-schematic-card";

const payload: SchematicPayload = {
  schemaVersion: HSC_SCHEMA_VERSION,
  viewport: {
    width: 100,
    height: 80
  },
  items: [
    {
      id: "value-1",
      type: "entityValue",
      layer: 500,
      x: 10,
      y: 20,
      entityId: "sensor.example",
      fallback: "offline"
    }
  ]
};

describe("ha-schematic-card", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("can be defined as a custom element", () => {
    expect(customElements.get(HA_SCHEMATIC_CARD_TAG)).toBe(HaSchematicCard);
  });

  it("stores a valid-looking config", async () => {
    const card = createCard();
    const encoded = encodePayload(payload);

    card.setConfig({
      type: "custom:ha-schematic-card",
      title: "Plant",
      payload: encoded
    });
    await card.updateComplete;

    expect(card.shadowRoot?.querySelector(".title")?.textContent).toBe("Plant");
    expect(card.shadowRoot?.querySelector("svg")).not.toBeNull();
  });

  it("shows an error when payload is missing", async () => {
    const card = createCard();

    card.setConfig({
      type: "custom:ha-schematic-card"
    });
    await card.updateComplete;

    expect(card.shadowRoot?.querySelector('[role="alert"]')?.textContent).toContain("Missing payload");
  });

  it("shows an error for invalid payload instead of throwing", async () => {
    const card = createCard();

    expect(() => card.setConfig({
      type: "custom:ha-schematic-card",
      payload: "not-hsc1"
    })).not.toThrow();
    await card.updateComplete;

    expect(card.shadowRoot?.querySelector('[role="alert"]')?.textContent).toContain("Invalid payload");
  });

  it("can receive a minimal hass object", async () => {
    const card = createCard();

    card.hass = {
      states: {
        "sensor.example": {
          state: "23"
        }
      }
    };
    card.setConfig({
      type: "custom:ha-schematic-card",
      payload: encodePayload(payload)
    });
    await card.updateComplete;

    expect(card.shadowRoot?.querySelector('[data-role="value"]')?.textContent).toBe("23");
  });

  it("renders without using innerHTML for SVG injection", async () => {
    const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
    const card = createCard();

    Object.defineProperty(Element.prototype, "innerHTML", {
      configurable: true,
      set() {
        throw new Error("innerHTML should not be used");
      }
    });

    expect(() => card.setConfig({
      type: "custom:ha-schematic-card",
      payload: encodePayload(payload)
    })).not.toThrow();
    await card.updateComplete;

    expect(card.shadowRoot?.querySelector("svg")).not.toBeNull();

    if (descriptor) {
      Object.defineProperty(Element.prototype, "innerHTML", descriptor);
    }
  });
});

function createCard(): HaSchematicCard {
  const card = document.createElement(HA_SCHEMATIC_CARD_TAG) as HaSchematicCard;
  document.body.append(card);
  return card;
}
