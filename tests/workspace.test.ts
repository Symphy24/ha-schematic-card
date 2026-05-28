import { describe, expect, it } from "vitest";

import { HA_SCHEMATIC_CARD_TAG } from "../packages/card/src";
import { HSC_CODEC_PREFIX } from "../packages/codec/src";
import { SCHEMATIC_RENDERER_NAME } from "../packages/renderer/src";
import { HSC_SCHEMA_VERSION } from "../packages/schema/src";
import { symbolRegistry } from "../packages/symbols/src";

describe("workspace placeholder exports", () => {
  it("can import and use package placeholders", () => {
    expect(HSC_SCHEMA_VERSION).toBe(1);
    expect(HSC_CODEC_PREFIX).toBe("hsc1");
    expect(SCHEMATIC_RENDERER_NAME).toBe("ha-schematic-renderer");
    expect(symbolRegistry).toEqual({});
    expect(HA_SCHEMATIC_CARD_TAG).toBe("ha-schematic-card");
  });
});
