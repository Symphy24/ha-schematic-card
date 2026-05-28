import { deflateSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

import {
  HSC_CODEC_PREFIX,
  decodePayload,
  encodePayload
} from "./index";
import {
  HSC_SCHEMA_VERSION,
  type SchematicPayload
} from "../../schema/src";

const minimalPayload: SchematicPayload = {
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

describe("hsc1 codec", () => {
  it("encodes and decodes a valid payload", () => {
    const encoded = encodePayload(minimalPayload);
    const decoded = decodePayload(encoded);

    expect(decoded).toEqual({
      ok: true,
      payload: minimalPayload
    });
  });

  it("uses the hsc1 prefix", () => {
    expect(encodePayload(minimalPayload).startsWith(`${HSC_CODEC_PREFIX}.`)).toBe(true);
  });

  it("ignores surrounding whitespace on decode", () => {
    const encoded = encodePayload(minimalPayload);

    expect(decodePayload(`\n ${encoded} \t`)).toEqual({
      ok: true,
      payload: minimalPayload
    });
  });

  it("fails invalid prefixes with a readable error", () => {
    expect(decodePayload("hsc2.demo")).toEqual({
      ok: false,
      errors: ["encoded payload must start with hsc1."]
    });
  });

  it("fails invalid base64url data with a readable error", () => {
    expect(decodePayload("hsc1.not base64")).toEqual({
      ok: false,
      errors: ["encoded payload data is not valid base64url"]
    });
  });

  it("fails invalid compressed data with a readable error", () => {
    expect(decodePayload("hsc1.abcd")).toEqual({
      ok: false,
      errors: ["encoded payload data could not be decompressed"]
    });
  });

  it("fails invalid JSON after decompression with a readable error", () => {
    const encoded = makeEncoded("not json");

    expect(decodePayload(encoded)).toEqual({
      ok: false,
      errors: ["decoded payload is not valid JSON"]
    });
  });

  it("fails schema-invalid decoded payloads", () => {
    const encoded = makeEncoded(JSON.stringify({
      schemaVersion: 999,
      viewport: {
        width: 800,
        height: 600
      },
      items: []
    }));

    expect(decodePayload(encoded)).toEqual({
      ok: false,
      errors: ["schemaVersion must be 1"]
    });
  });

  it("does not throw for normal bad user input", () => {
    expect(() => decodePayload(42)).not.toThrow();
    expect(() => decodePayload("hsc1.abcd")).not.toThrow();
  });

  it("throws when asked to encode an invalid developer payload", () => {
    expect(() => encodePayload({
      schemaVersion: 999,
      viewport: {
        width: 800,
        height: 600
      },
      items: []
    })).toThrow("Cannot encode invalid schematic payload");
  });
});

function makeEncoded(json: string): string {
  return `${HSC_CODEC_PREFIX}.${base64UrlEncode(deflateSync(strToU8(json)))}`;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
