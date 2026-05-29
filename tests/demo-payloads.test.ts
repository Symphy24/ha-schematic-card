import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { decodePayload } from "../packages/codec/src";
import { validateSchematicPayload } from "../packages/schema/src";

describe("demo payload fixtures", () => {
  it("includes decoded JSON that validates against the schema", async () => {
    const payload = await readJsonFixture();
    const validation = validateSchematicPayload(payload);

    expect(validation).toEqual({
      valid: true,
      errors: []
    });
    expect(Array.isArray(payload.symbols)).toBe(true);
    expect(symbolItemsFor(payload, "demo-generic-unit")).toHaveLength(2);
    expect(visibilityItemsFor(payload, "input_boolean.schematic_demo_alarm", "on")).toHaveLength(2);
    expect(styleItemsFor(payload, "input_boolean.schematic_demo_alarm", "on")).toHaveLength(1);
    expect(flowItemsFor(payload, "input_boolean.schematic_demo_flow", "on")).toHaveLength(1);
    expect(formattedEntityValueItemsFor(payload, "input_number.schematic_demo_temperature")).toHaveLength(1);
  });

  it("includes an encoded hsc1 payload that decodes successfully", async () => {
    const expected = await readJsonFixture();
    const encoded = await readTextFixture("minimal.hsc1.txt");
    const decoded = decodePayload(encoded);

    expect(decoded.ok).toBe(true);
    if (decoded.ok) {
      expect(decoded.payload).toEqual(expected);
      expect(decoded.payload.items.length).toBeGreaterThanOrEqual(4);
    }
  });
});

async function readJsonFixture(): Promise<Record<string, unknown> & { items: unknown[] }> {
  return JSON.parse(await readTextFixture("minimal.json"));
}

async function readTextFixture(fileName: string): Promise<string> {
  return readFile(new URL(`./examples/demo-payloads/${fileName}`, `file://${process.cwd()}/`), "utf8");
}

function isItemType(value: unknown, type: string): boolean {
  return typeof value === "object" && value !== null && "type" in value && value.type === type;
}

function symbolItemsFor(payload: { items: unknown[] }, symbolId: string): unknown[] {
  return payload.items.filter((item) => (
    isItemType(item, "symbol")
    && hasSymbolId(item, symbolId)
  ));
}

function hasSymbolId(value: unknown, symbolId: string): boolean {
  return (
    typeof value === "object"
    && value !== null
    && "symbolId" in value
    && value.symbolId === symbolId
  );
}

function visibilityItemsFor(payload: { items: unknown[] }, entityId: string, equals: string): unknown[] {
  return payload.items.filter((item) => hasVisibleWhen(item, entityId, equals));
}

function styleItemsFor(payload: { items: unknown[] }, entityId: string, equals: string): unknown[] {
  return payload.items.filter((item) => hasStyleWhen(item, entityId, equals));
}

function formattedEntityValueItemsFor(payload: { items: unknown[] }, entityId: string): unknown[] {
  return payload.items.filter((item) => (
    isItemType(item, "entityValue")
    && hasEntityId(item, entityId)
    && hasPrecision(item, 1)
  ));
}

function flowItemsFor(payload: { items: unknown[] }, entityId: string, equals: string): unknown[] {
  return payload.items.filter((item) => hasFlow(item, entityId, equals));
}

function hasVisibleWhen(value: unknown, entityId: string, equals: string): boolean {
  if (typeof value !== "object" || value === null || !("visibleWhen" in value)) {
    return false;
  }

  return hasCondition(value.visibleWhen, entityId, equals);
}

function hasStyleWhen(value: unknown, entityId: string, equals: string): boolean {
  if (typeof value !== "object" || value === null || !("styleWhen" in value)) {
    return false;
  }

  return Array.isArray(value.styleWhen)
    && value.styleWhen.some((entry) => (
      typeof entry === "object"
      && entry !== null
      && "when" in entry
      && hasCondition(entry.when, entityId, equals)
    ));
}

function hasFlow(value: unknown, entityId: string, equals: string): boolean {
  if (typeof value !== "object" || value === null || !("flow" in value)) {
    return false;
  }

  const flow = value.flow;
  return (
    typeof flow === "object"
    && flow !== null
    && "type" in flow
    && flow.type === "dash"
    && "enabledWhen" in flow
    && hasCondition(flow.enabledWhen, entityId, equals)
  );
}

function hasCondition(value: unknown, entityId: string, equals: string): boolean {
  return (
    typeof value === "object"
    && value !== null
    && "entityId" in value
    && value.entityId === entityId
    && "equals" in value
    && value.equals === equals
  );
}

function hasEntityId(value: unknown, entityId: string): boolean {
  return (
    typeof value === "object"
    && value !== null
    && "entityId" in value
    && value.entityId === entityId
  );
}

function hasPrecision(value: unknown, precision: number): boolean {
  return (
    typeof value === "object"
    && value !== null
    && "precision" in value
    && value.precision === precision
  );
}
