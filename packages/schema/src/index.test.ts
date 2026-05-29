import { describe, expect, it } from "vitest";

import {
  HSC_SCHEMA_VERSION,
  type SchematicPayload,
  isSchematicPayload,
  validateSchematicPayload
} from "./index";

describe("schema validation", () => {
  it("accepts a minimal valid payload", () => {
    const payload: SchematicPayload = {
      schemaVersion: HSC_SCHEMA_VERSION,
      viewport: {
        width: 800,
        height: 600
      },
      items: [
        {
          id: "line-1",
          type: "line",
          layer: 100,
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 100
        }
      ]
    };

    expect(validateSchematicPayload(payload)).toEqual({
      valid: true,
      errors: []
    });
    expect(isSchematicPayload(payload)).toBe(true);
  });

  it("rejects the wrong schema version", () => {
    const result = validateSchematicPayload({
      schemaVersion: 999,
      viewport: {
        width: 800,
        height: 600
      },
      items: []
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("schemaVersion must be 1");
  });

  it("rejects a missing viewport", () => {
    const result = validateSchematicPayload({
      schemaVersion: HSC_SCHEMA_VERSION,
      items: []
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("viewport must be an object");
  });

  it("rejects unsupported item types", () => {
    const result = validateSchematicPayload({
      schemaVersion: HSC_SCHEMA_VERSION,
      viewport: {
        width: 800,
        height: 600
      },
      items: [
        {
          id: "bad-1",
          type: "script",
          layer: 100
        }
      ]
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("items[0].type must be a supported item type");
  });

  it("validates group children recursively", () => {
    const result = validateSchematicPayload({
      schemaVersion: HSC_SCHEMA_VERSION,
      viewport: {
        width: 800,
        height: 600
      },
      items: [
        {
          id: "group-1",
          type: "group",
          layer: 300,
          children: [
            {
              id: "nested-bad-1",
              type: "html",
              layer: 301
            }
          ]
        }
      ]
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("items[0].children[0].type must be a supported item type");
  });

  it("accepts numeric layers without changing them", () => {
    const payload: SchematicPayload = {
      schemaVersion: HSC_SCHEMA_VERSION,
      viewport: {
        width: 800,
        height: 600
      },
      items: [
        {
          id: "value-1",
          type: "entityValue",
          layer: 550,
          x: 20,
          y: 30,
          entityId: "sensor.example"
        }
      ]
    };

    expect(validateSchematicPayload(payload).valid).toBe(true);
    expect(payload.items[0]?.layer).toBe(550);
  });

  it("accepts a structured visibility condition", () => {
    const payload: SchematicPayload = {
      schemaVersion: HSC_SCHEMA_VERSION,
      viewport: {
        width: 800,
        height: 600
      },
      items: [
        {
          id: "alarm-badge",
          type: "circle",
          layer: 700,
          cx: 10,
          cy: 10,
          r: 5,
          visibleWhen: {
            entityId: "binary_sensor.alarm",
            equals: "on"
          }
        }
      ]
    };

    expect(validateSchematicPayload(payload)).toEqual({
      valid: true,
      errors: []
    });
  });

  it("rejects invalid visibility conditions", () => {
    const result = validateSchematicPayload({
      schemaVersion: HSC_SCHEMA_VERSION,
      viewport: {
        width: 800,
        height: 600
      },
      items: [
        {
          id: "alarm-badge",
          type: "circle",
          layer: 700,
          cx: 10,
          cy: 10,
          r: 5,
          visibleWhen: {
            entityId: "",
            equals: true
          }
        }
      ]
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("items[0].visibleWhen.entityId must be a non-empty string");
    expect(result.errors).toContain("items[0].visibleWhen.equals must be a string");
  });

  it("accepts symbol definitions and symbol instances", () => {
    const payload: SchematicPayload = {
      schemaVersion: HSC_SCHEMA_VERSION,
      viewport: {
        width: 800,
        height: 600
      },
      symbols: [
        {
          id: "generic-box",
          viewport: {
            width: 20,
            height: 20
          },
          items: [
            {
              id: "box-rect",
              type: "rect",
              layer: 300,
              x: 0,
              y: 0,
              width: 20,
              height: 20
            }
          ]
        }
      ],
      items: [
        {
          id: "box-1",
          type: "symbol",
          layer: 300,
          symbolId: "generic-box",
          x: 10,
          y: 20,
          scale: 2
        }
      ]
    };

    expect(validateSchematicPayload(payload)).toEqual({
      valid: true,
      errors: []
    });
  });

  it("rejects symbol instances that reference missing definitions", () => {
    const result = validateSchematicPayload({
      schemaVersion: HSC_SCHEMA_VERSION,
      viewport: {
        width: 800,
        height: 600
      },
      items: [
        {
          id: "box-1",
          type: "symbol",
          layer: 300,
          symbolId: "missing-symbol",
          x: 10,
          y: 20
        }
      ]
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("items[0].symbolId must reference a defined symbol");
  });

  it("rejects duplicate symbol definition ids", () => {
    const result = validateSchematicPayload({
      schemaVersion: HSC_SCHEMA_VERSION,
      viewport: {
        width: 800,
        height: 600
      },
      symbols: [
        {
          id: "generic-box",
          items: []
        },
        {
          id: "generic-box",
          items: []
        }
      ],
      items: []
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("symbols[1].id must be unique");
  });

  it("rejects nested symbol references inside symbol definitions", () => {
    const result = validateSchematicPayload({
      schemaVersion: HSC_SCHEMA_VERSION,
      viewport: {
        width: 800,
        height: 600
      },
      symbols: [
        {
          id: "outer-symbol",
          items: [
            {
              id: "nested-symbol",
              type: "symbol",
              layer: 300,
              symbolId: "outer-symbol",
              x: 0,
              y: 0
            }
          ]
        }
      ],
      items: []
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("symbols[0].items[0].type cannot be symbol inside a symbol definition");
  });

  it("accepts a valid path item", () => {
    const result = validateSchematicPayload({
      schemaVersion: HSC_SCHEMA_VERSION,
      viewport: {
        width: 800,
        height: 600
      },
      items: [
        {
          id: "path-1",
          type: "path",
          layer: 400,
          d: "M 10 10 L 40 10 L 25 30 Z"
        }
      ]
    });

    expect(result).toEqual({
      valid: true,
      errors: []
    });
  });

  it("rejects empty path data", () => {
    const result = validateSchematicPayload({
      schemaVersion: HSC_SCHEMA_VERSION,
      viewport: {
        width: 800,
        height: 600
      },
      items: [
        {
          id: "path-1",
          type: "path",
          layer: 400,
          d: ""
        }
      ]
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("items[0].d must be a non-empty path data string");
  });

  it("rejects markup-like path data", () => {
    const result = validateSchematicPayload({
      schemaVersion: HSC_SCHEMA_VERSION,
      viewport: {
        width: 800,
        height: 600
      },
      items: [
        {
          id: "path-1",
          type: "path",
          layer: 400,
          d: "M 0 0 <script>"
        }
      ]
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("items[0].d contains unsupported or unsafe path data");
  });

  it("accepts valid structured transforms", () => {
    const result = validateSchematicPayload({
      schemaVersion: HSC_SCHEMA_VERSION,
      viewport: {
        width: 800,
        height: 600
      },
      items: [
        {
          id: "rect-1",
          type: "rect",
          layer: 300,
          x: 0,
          y: 0,
          width: 10,
          height: 10,
          transform: [
            { type: "translate", x: 10, y: 20 },
            { type: "rotate", angle: 45, cx: 5, cy: 5 },
            { type: "scale", x: 2, y: 1.5 }
          ]
        }
      ]
    });

    expect(result.valid).toBe(true);
  });

  it("rejects invalid transform types", () => {
    const result = validateSchematicPayload({
      schemaVersion: HSC_SCHEMA_VERSION,
      viewport: {
        width: 800,
        height: 600
      },
      items: [
        {
          id: "rect-1",
          type: "rect",
          layer: 300,
          x: 0,
          y: 0,
          width: 10,
          height: 10,
          transform: [
            { type: "skew", x: 10 }
          ]
        }
      ]
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("items[0].transform[0].type must be a supported transform type");
  });

  it("rejects transforms with non-numeric values", () => {
    const result = validateSchematicPayload({
      schemaVersion: HSC_SCHEMA_VERSION,
      viewport: {
        width: 800,
        height: 600
      },
      items: [
        {
          id: "rect-1",
          type: "rect",
          layer: 300,
          x: 0,
          y: 0,
          width: 10,
          height: 10,
          transform: [
            { type: "translate", x: "10", y: 20 }
          ]
        }
      ]
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("items[0].transform[0].x must be a finite number");
  });
});
