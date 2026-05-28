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

## Build

Build the browser-ready Lovelace resource:

```sh
npm run build
```

The card bundle is generated at:

```text
packages/card/dist/ha-schematic-card.js
```

This is an early manual-test build, not full HACS release packaging.

## Manual Testing

For local Home Assistant testing later, copy the generated file to a path such as:

```text
config/www/ha-schematic-card/ha-schematic-card.js
```

Then add a Lovelace resource:

```text
/local/ha-schematic-card/ha-schematic-card.js
```

Use a test card config:

```yaml
type: custom:ha-schematic-card
title: Schematic
payload: hsc1....
```

Future HACS installs are expected to load the built resource from:

```text
/hacsfiles/ha-schematic-card/ha-schematic-card.js
```
