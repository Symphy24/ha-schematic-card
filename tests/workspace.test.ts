import { describe, expect, it } from "vitest";

import { HA_SCHEMATIC_CARD_TAG } from "../packages/card/src";
import { encodeSchematicPayload } from "../packages/codec/src";
import { SCHEMATIC_RENDERER_NAME } from "../packages/renderer/src";
import { SCHEMATIC_SCHEMA_VERSION } from "../packages/schema/src";
import { symbolRegistry } from "../packages/symbols/src";

describe("workspace placeholder exports", () => {
  it("can import and use package placeholders", () => {
    expect(SCHEMATIC_SCHEMA_VERSION).toBe("0.0.0");
    expect(encodeSchematicPayload("demo")).toBe("demo");
    expect(SCHEMATIC_RENDERER_NAME).toBe("ha-schematic-renderer");
    expect(symbolRegistry).toEqual({});
    expect(HA_SCHEMATIC_CARD_TAG).toBe("ha-schematic-card");
  });
});
