# Card

Early foundation for the Home Assistant Lovelace custom card.

Expected future config shape:

```yaml
type: custom:ha-schematic-card
title: Schematic
payload: hsc1....
```

The card decodes payloads through `@ha-schematic-card/codec` and renders safe SVG through `@ha-schematic-card/renderer`.

The rendered SVG scales responsively to the available card width while preserving the payload viewBox. Home Assistant `grid_options` can still be used to allocate more dashboard space; for very large schematics, setting explicit rows may provide a better vertical area than `rows: auto`.

The card includes a minimal Lovelace config editor for `title` and `payload`. The payload is pasted from a future external editor/generator.

The config editor also has a "Copy current theme variables" button. It copies selected Home Assistant CSS variables as JSON for the future external editor preview, without modifying the schematic payload. If browser clipboard access is unavailable, which can happen over HTTP or a local IP address, the editor shows the JSON so it can be copied manually.

This package does not yet include a full schematic drawing editor, HACS packaging, or theme-copy support.

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
