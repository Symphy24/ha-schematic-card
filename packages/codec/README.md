# Codec

Encoding and decoding helpers for schematic payloads exchanged between the future editor and Home Assistant card.

The current format is:

```text
hsc1.<base64url(deflate(json))>
```

This is compression and transport encoding, not encryption. Decoded payloads are validated with `@ha-schematic-card/schema` before they are returned.

The format may evolve through future codec and schema versions.
