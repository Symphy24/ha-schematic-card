# Card

Early foundation for the Home Assistant Lovelace custom card.

Expected future config shape:

```yaml
type: custom:ha-schematic-card
title: Schematic
payload: hsc1....
```

The card decodes payloads through `@ha-schematic-card/codec` and renders safe SVG through `@ha-schematic-card/renderer`.

This package does not yet include a full UI editor, HACS packaging, or theme-copy support.
