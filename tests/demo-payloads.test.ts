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
    expect(payload.items.some((item) => isItemType(item, "entityValue"))).toBe(true);
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
