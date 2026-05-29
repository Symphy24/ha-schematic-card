import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";

import {
  renderSchematicSvg,
  sortItemsByLayer
} from "./index";
import {
  HSC_SCHEMA_VERSION,
  type SchematicItem,
  type SchematicPayload,
  type SchematicSymbolChildItem
} from "../../schema/src";

function createDocument(): Document {
  return new Window().document as unknown as Document;
}

function createPayload(items: SchematicItem[]): SchematicPayload {
  return {
    schemaVersion: HSC_SCHEMA_VERSION,
    viewport: {
      width: 320,
      height: 180
    },
    items
  };
}

describe("SVG renderer", () => {
  it("creates an SVG element with viewport attributes", () => {
    const svg = renderSchematicSvg(createPayload([]), {
      document: createDocument()
    });

    expect(svg.tagName.toLowerCase()).toBe("svg");
    expect(svg.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(svg.getAttribute("viewBox")).toBe("0 0 320 180");
    expect(svg.getAttribute("preserveAspectRatio")).toBe("xMidYMid meet");
    expect(svg.getAttribute("width")).toBe("320");
    expect(svg.getAttribute("height")).toBe("180");
    expect(svg.getAttribute("class")).toBe("ha-schematic-card-svg");
  });

  it("renders items in ascending layer order", () => {
    const svg = renderSchematicSvg(createPayload([
      rectItem("top", 300),
      rectItem("bottom", 100),
      rectItem("middle", 200)
    ]), {
      document: createDocument()
    });

    expect(childIds(svg)).toEqual(["bottom", "middle", "top"]);
  });

  it("does not mutate the original items array when sorting or rendering", () => {
    const items = [
      rectItem("top", 300),
      rectItem("bottom", 100)
    ];

    expect(sortItemsByLayer(items).map((item) => item.id)).toEqual(["bottom", "top"]);
    renderSchematicSvg(createPayload(items), {
      document: createDocument()
    });

    expect(items.map((item) => item.id)).toEqual(["top", "bottom"]);
  });

  it("skips invisible items", () => {
    const svg = renderSchematicSvg(createPayload([
      {
        ...rectItem("hidden", 100),
        visible: false
      },
      rectItem("visible", 200)
    ]), {
      document: createDocument()
    });

    expect(childIds(svg)).toEqual(["visible"]);
  });

  it("renders items when entity visibility conditions match", () => {
    const svg = renderSchematicSvg(createPayload([
      {
        ...rectItem("visible-when-on", 100),
        visibleWhen: {
          entityId: "binary_sensor.alarm",
          equals: "on"
        }
      }
    ]), {
      document: createDocument(),
      entityStates: {
        "binary_sensor.alarm": "on"
      }
    });

    expect(childIds(svg)).toEqual(["visible-when-on"]);
  });

  it("skips items when entity visibility conditions do not match", () => {
    const svg = renderSchematicSvg(createPayload([
      {
        ...rectItem("hidden-when-off", 100),
        visibleWhen: {
          entityId: "binary_sensor.alarm",
          equals: "on"
        }
      },
      rectItem("always-visible", 200)
    ]), {
      document: createDocument(),
      entityStates: {
        "binary_sensor.alarm": "off"
      }
    });

    expect(childIds(svg)).toEqual(["always-visible"]);
  });

  it("applies visibility conditions inside groups", () => {
    const svg = renderSchematicSvg(createPayload([
      {
        id: "group-1",
        type: "group",
        layer: 100,
        children: [
          {
            ...rectItem("conditional-child", 100),
            visibleWhen: {
              entityId: "binary_sensor.alarm",
              equals: "on"
            }
          },
          rectItem("normal-child", 200)
        ]
      }
    ]), {
      document: createDocument(),
      entityStates: {
        "binary_sensor.alarm": "off"
      }
    });

    expect(childIds(svg.children[0] as Element)).toEqual(["normal-child"]);
  });

  it("applies conditional styles when entity conditions match", () => {
    const svg = renderSchematicSvg(createPayload([
      {
        ...rectItem("status", 100),
        style: {
          fill: "var(--success-color)",
          strokeWidth: 1
        },
        styleWhen: [
          {
            when: {
              entityId: "input_boolean.alarm",
              equals: "on"
            },
            style: {
              fill: "var(--error-color)",
              strokeWidth: 3
            }
          }
        ]
      }
    ]), {
      document: createDocument(),
      entityStates: {
        "input_boolean.alarm": "on"
      }
    });

    const status = svg.children[0];

    expect(status?.getAttribute("fill")).toBe("var(--error-color)");
    expect(status?.getAttribute("stroke-width")).toBe("3");
  });

  it("keeps base styles when conditional styles do not match", () => {
    const svg = renderSchematicSvg(createPayload([
      {
        ...rectItem("status", 100),
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
    ]), {
      document: createDocument(),
      entityStates: {
        "input_boolean.alarm": "off"
      }
    });

    expect(svg.children[0]?.getAttribute("fill")).toBe("var(--success-color)");
  });

  it("renders and sorts group children recursively", () => {
    const svg = renderSchematicSvg(createPayload([
      {
        id: "group-1",
        type: "group",
        layer: 100,
        children: [
          rectItem("child-top", 300),
          rectItem("child-bottom", 100)
        ]
      }
    ]), {
      document: createDocument()
    });

    const group = svg.children[0];

    expect(group?.tagName.toLowerCase()).toBe("g");
    expect(childIds(group as Element)).toEqual(["child-bottom", "child-top"]);
  });

  it("renders symbol instances from payload definitions", () => {
    const payload: SchematicPayload = {
      ...createPayload([
        {
          id: "symbol-1",
          type: "symbol",
          layer: 300,
          symbolId: "generic-box",
          x: 10,
          y: 20,
          scale: 2
        }
      ]),
      symbols: [
        {
          id: "generic-box",
          items: [
            symbolRectItem("symbol-child-top", 300),
            symbolRectItem("symbol-child-bottom", 100)
          ]
        }
      ]
    };

    const svg = renderSchematicSvg(payload, {
      document: createDocument()
    });
    const symbol = svg.children[0];

    expect(symbol?.tagName.toLowerCase()).toBe("g");
    expect(symbol?.getAttribute("data-symbol-id")).toBe("generic-box");
    expect(symbol?.getAttribute("transform")).toBe("translate(10 20) scale(2)");
    expect(childIds(symbol as Element)).toEqual(["symbol-child-bottom", "symbol-child-top"]);
  });

  it("combines symbol placement with structured transforms", () => {
    const payload: SchematicPayload = {
      ...createPayload([
        {
          id: "symbol-1",
          type: "symbol",
          layer: 300,
          symbolId: "generic-box",
          x: 10,
          y: 20,
          transform: [
            { type: "rotate", angle: 45 }
          ]
        }
      ]),
      symbols: [
        {
          id: "generic-box",
          items: [
            symbolRectItem("symbol-child", 100)
          ]
        }
      ]
    };

    const svg = renderSchematicSvg(payload, {
      document: createDocument()
    });

    expect(svg.children[0]?.getAttribute("transform")).toBe("translate(10 20) rotate(45)");
  });

  it("renders basic primitive attributes", () => {
    const svg = renderSchematicSvg(createPayload([
      {
        id: "line-1",
        type: "line",
        layer: 100,
        x1: 1,
        y1: 2,
        x2: 3,
        y2: 4,
        style: {
          stroke: "var(--primary-text-color)",
          strokeWidth: 2
        }
      },
      {
        id: "polyline-1",
        type: "polyline",
        layer: 200,
        points: [
          { x: 1, y: 2 },
          { x: 3, y: 4 }
        ]
      },
      {
        id: "circle-1",
        type: "circle",
        layer: 300,
        cx: 5,
        cy: 6,
        r: 7
      },
      {
        id: "text-1",
        type: "text",
        layer: 400,
        x: 8,
        y: 9,
        text: "Safe text"
      }
    ]), {
      document: createDocument()
    });

    const line = svg.children[0];
    const polyline = svg.children[1];
    const circle = svg.children[2];
    const text = svg.children[3];

    expect(line?.tagName.toLowerCase()).toBe("line");
    expect(line?.getAttribute("x1")).toBe("1");
    expect(line?.getAttribute("stroke")).toBe("var(--primary-text-color)");
    expect(line?.getAttribute("stroke-width")).toBe("2");
    expect(polyline?.getAttribute("points")).toBe("1,2 3,4");
    expect(circle?.getAttribute("r")).toBe("7");
    expect(text?.textContent).toBe("Safe text");
  });

  it("renders path items with path data", () => {
    const svg = renderSchematicSvg(createPayload([
      {
        id: "path-1",
        type: "path",
        layer: 400,
        d: "M 10 10 L 20 20",
        style: {
          fill: "none",
          stroke: "currentColor"
        }
      }
    ]), {
      document: createDocument()
    });

    const path = svg.children[0];

    expect(path?.tagName.toLowerCase()).toBe("path");
    expect(path?.getAttribute("d")).toBe("M 10 10 L 20 20");
    expect(path?.getAttribute("fill")).toBe("none");
    expect(path?.getAttribute("stroke")).toBe("currentColor");
  });

  it("renders structured transforms", () => {
    const svg = renderSchematicSvg(createPayload([
      {
        ...rectItem("rect-1", 100),
        transform: [
          { type: "translate", x: 10, y: 20 },
          { type: "rotate", angle: 45, cx: 5, cy: 6 },
          { type: "scale", x: 2 }
        ]
      }
    ]), {
      document: createDocument()
    });

    expect(svg.children[0]?.getAttribute("transform")).toBe("translate(10 20) rotate(45 5 6) scale(2)");
  });

  it("applies transforms to groups", () => {
    const svg = renderSchematicSvg(createPayload([
      {
        id: "group-1",
        type: "group",
        layer: 100,
        transform: [
          { type: "rotate", angle: 45 }
        ],
        children: [
          rectItem("child-1", 100)
        ]
      }
    ]), {
      document: createDocument()
    });

    expect(svg.children[0]?.getAttribute("transform")).toBe("rotate(45)");
  });

  it("does not apply URL-based paint values", () => {
    const svg = renderSchematicSvg(createPayload([
      {
        ...rectItem("rect-1", 100),
        style: {
          fill: "url(https://example.com/pattern.svg)",
          stroke: "url(#paint)"
        }
      }
    ]), {
      document: createDocument()
    });

    const rect = svg.children[0];

    expect(rect?.getAttribute("fill")).toBeNull();
    expect(rect?.getAttribute("stroke")).toBeNull();
  });

  it("renders entityValue fallback when no state is provided", () => {
    const svg = renderSchematicSvg(createPayload([
      {
        id: "value-1",
        type: "entityValue",
        layer: 500,
        x: 10,
        y: 20,
        entityId: "sensor.example",
        fallback: "unknown"
      }
    ]), {
      document: createDocument()
    });

    expect(svg.querySelector('[data-role="value"]')?.textContent).toBe("unknown");
  });

  it("renders entityValue state when provided", () => {
    const svg = renderSchematicSvg(createPayload([
      {
        id: "value-1",
        type: "entityValue",
        layer: 500,
        x: 10,
        y: 20,
        entityId: "sensor.example",
        fallback: "unknown",
        unit: "C"
      }
    ]), {
      document: createDocument(),
      entityStates: {
        "sensor.example": 21
      }
    });

    expect(svg.querySelector('[data-role="value"]')?.textContent).toBe("21 C");
  });

  it("formats entityValue numbers with precision", () => {
    const svg = renderSchematicSvg(createPayload([
      {
        id: "value-1",
        type: "entityValue",
        layer: 500,
        x: 10,
        y: 20,
        entityId: "sensor.example",
        precision: 1,
        unit: "C"
      }
    ]), {
      document: createDocument(),
      entityStates: {
        "sensor.example": "21.26"
      }
    });

    expect(svg.querySelector('[data-role="value"]')?.textContent).toBe("21.3 C");
  });

  it("uses Home Assistant unit attributes when no payload unit is provided", () => {
    const svg = renderSchematicSvg(createPayload([
      {
        id: "value-1",
        type: "entityValue",
        layer: 500,
        x: 10,
        y: 20,
        entityId: "sensor.example",
        precision: 0
      }
    ]), {
      document: createDocument(),
      entityStates: {
        "sensor.example": {
          state: "21.6",
          attributes: {
            unit_of_measurement: "C"
          }
        }
      }
    });

    expect(svg.querySelector('[data-role="value"]')?.textContent).toBe("22 C");
  });

  it("renders fallback for unknown or unavailable entityValue states", () => {
    const svg = renderSchematicSvg(createPayload([
      {
        id: "value-1",
        type: "entityValue",
        layer: 500,
        x: 10,
        y: 20,
        entityId: "sensor.example",
        fallback: "offline",
        unit: "C"
      }
    ]), {
      document: createDocument(),
      entityStates: {
        "sensor.example": "unavailable"
      }
    });

    expect(svg.querySelector('[data-role="value"]')?.textContent).toBe("offline");
  });

  it("renders unavailableText when no fallback is provided", () => {
    const svg = renderSchematicSvg(createPayload([
      {
        id: "value-1",
        type: "entityValue",
        layer: 500,
        x: 10,
        y: 20,
        entityId: "sensor.example",
        unavailableText: "n/a"
      }
    ]), {
      document: createDocument(),
      entityStates: {
        "sensor.example": "unknown"
      }
    });

    expect(svg.querySelector('[data-role="value"]')?.textContent).toBe("n/a");
  });

  it("does not assign innerHTML while rendering", () => {
    const window = new Window();
    const descriptor = Object.getOwnPropertyDescriptor(window.Element.prototype, "innerHTML");

    Object.defineProperty(window.Element.prototype, "innerHTML", {
      configurable: true,
      set() {
        throw new Error("innerHTML should not be used");
      }
    });

    expect(() => renderSchematicSvg(createPayload([
      {
        id: "text-1",
        type: "text",
        layer: 100,
        x: 0,
        y: 0,
        text: "<script>alert(1)</script>"
      }
    ]), {
      document: window.document as unknown as Document
    })).not.toThrow();

    if (descriptor) {
      Object.defineProperty(window.Element.prototype, "innerHTML", descriptor);
    }
  });
});

function rectItem(id: string, layer: number): SchematicItem {
  return symbolRectItem(id, layer);
}

function symbolRectItem(id: string, layer: number): SchematicSymbolChildItem {
  return {
    id,
    type: "rect",
    layer,
    x: 0,
    y: 0,
    width: 10,
    height: 10
  };
}

function childIds(element: Element): string[] {
  return Array.from(element.children).map((child) => child.getAttribute("data-id") ?? "");
}
