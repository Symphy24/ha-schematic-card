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

  it("imports the card entry module without throwing", async () => {
    await expect(import("./index")).resolves.toBeDefined();
  });

  it("returns the config editor element", () => {
    expect(HaSchematicCard.getConfigElement().tagName.toLowerCase()).toBe("ha-schematic-card-editor");
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

  it("renders the SVG in the responsive schematic container", async () => {
    const card = createCard();

    card.setConfig({
      type: "custom:ha-schematic-card",
      payload: encodePayload(payload)
    });
    await card.updateComplete;

    const container = card.shadowRoot?.querySelector(".svg-container");
    const svg = container?.querySelector("svg");

    expect(container).not.toBeNull();
    expect(svg?.getAttribute("class")).toBe("ha-schematic-card-svg");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 100 80");
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

  it("passes Home Assistant unit attributes to entityValue rendering", async () => {
    const unitPayload: SchematicPayload = {
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
          precision: 1
        }
      ]
    };
    const card = createCard();

    card.hass = {
      states: {
        "sensor.example": {
          state: "23.44",
          attributes: {
            unit_of_measurement: "C"
          }
        }
      }
    };
    card.setConfig({
      type: "custom:ha-schematic-card",
      payload: encodePayload(unitPayload)
    });
    await card.updateComplete;

    expect(card.shadowRoot?.querySelector('[data-role="value"]')?.textContent).toBe("23.4 C");
  });

  it("passes hass entity states to renderer visibility conditions", async () => {
    const conditionalPayload: SchematicPayload = {
      schemaVersion: HSC_SCHEMA_VERSION,
      viewport: {
        width: 100,
        height: 80
      },
      items: [
        {
          id: "alarm-badge",
          type: "circle",
          layer: 700,
          cx: 10,
          cy: 20,
          r: 5,
          visibleWhen: {
            entityId: "binary_sensor.alarm",
            equals: "on"
          }
        }
      ]
    };
    const card = createCard();

    card.hass = {
      states: {
        "binary_sensor.alarm": {
          state: "on"
        }
      }
    };
    card.setConfig({
      type: "custom:ha-schematic-card",
      payload: encodePayload(conditionalPayload)
    });
    await card.updateComplete;

    expect(card.shadowRoot?.querySelector('[data-id="alarm-badge"]')).not.toBeNull();
  });

  it("passes hass entity states to renderer conditional styles", async () => {
    const conditionalPayload: SchematicPayload = {
      schemaVersion: HSC_SCHEMA_VERSION,
      viewport: {
        width: 100,
        height: 80
      },
      items: [
        {
          id: "status-dot",
          type: "circle",
          layer: 700,
          cx: 10,
          cy: 20,
          r: 5,
          style: {
            fill: "var(--success-color)"
          },
          styleWhen: [
            {
              when: {
                entityId: "input_boolean.alarm",
                equals: "on"
              },
              style: {
                fill: "var(--error-color)"
              }
            }
          ]
        }
      ]
    };
    const card = createCard();

    card.hass = {
      states: {
        "input_boolean.alarm": {
          state: "on"
        }
      }
    };
    card.setConfig({
      type: "custom:ha-schematic-card",
      payload: encodePayload(conditionalPayload)
    });
    await card.updateComplete;

    expect(card.shadowRoot?.querySelector('[data-id="status-dot"]')?.getAttribute("fill"))
      .toBe("var(--error-color)");
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
