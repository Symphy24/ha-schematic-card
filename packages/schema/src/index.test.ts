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
});
