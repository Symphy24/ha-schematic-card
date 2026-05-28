import { deflateSync, inflateSync, strFromU8, strToU8 } from "fflate";

import {
  type SchematicPayload,
  validateSchematicPayload
} from "@ha-schematic-card/schema";

export const HSC_CODEC_PREFIX = "hsc1";

export type DecodeResult =
  | {
      ok: true;
      payload: SchematicPayload;
    }
  | {
      ok: false;
      errors: string[];
    };

export function encodePayload(payload: SchematicPayload): string {
  const validation = validateSchematicPayload(payload);

  if (!validation.valid) {
    throw new Error(`Cannot encode invalid schematic payload: ${validation.errors.join("; ")}`);
  }

  const json = JSON.stringify(payload);
  const compressed = deflateSync(strToU8(json));
  return `${HSC_CODEC_PREFIX}.${base64UrlEncode(compressed)}`;
}

export function decodePayload(encoded: unknown): DecodeResult {
  if (typeof encoded !== "string") {
    return invalid("encoded payload must be a string");
  }

  const trimmed = encoded.trim();
  const prefix = `${HSC_CODEC_PREFIX}.`;

  if (!trimmed.startsWith(prefix)) {
    return invalid(`encoded payload must start with ${prefix}`);
  }

  const data = trimmed.slice(prefix.length);

  if (data.length === 0) {
    return invalid("encoded payload data is empty");
  }

  let compressed: Uint8Array;
  try {
    compressed = base64UrlDecode(data);
  } catch {
    return invalid("encoded payload data is not valid base64url");
  }

  let json: string;
  try {
    json = strFromU8(inflateSync(compressed));
  } catch {
    return invalid("encoded payload data could not be decompressed");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return invalid("decoded payload is not valid JSON");
  }

  const validation = validateSchematicPayload(parsed);
  if (!validation.valid) {
    return {
      ok: false,
      errors: validation.errors
    };
  }

  return {
    ok: true,
    payload: parsed as SchematicPayload
  };
}

function invalid(error: string): DecodeResult {
  return {
    ok: false,
    errors: [error]
  };
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error("Invalid base64url data");
  }

  const paddingLength = (4 - (value.length % 4)) % 4;
  const padded = `${value.replaceAll("-", "+").replaceAll("_", "/")}${"=".repeat(paddingLength)}`;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}
