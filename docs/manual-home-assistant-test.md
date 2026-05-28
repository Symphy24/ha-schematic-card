# Manual Home Assistant Test

This project is still early and not HACS-ready. These steps are for manual local testing of the current card pipeline.

## Build

```sh
npm install
npm run build
```

The card bundle is generated at:

```text
packages/card/dist/ha-schematic-card.js
```

## Copy To Home Assistant

Copy the built file to your Home Assistant config directory, for example:

```text
config/www/ha-schematic-card/ha-schematic-card.js
```

## Add Lovelace Resource

Add a manual Lovelace resource:

```text
/local/ha-schematic-card/ha-schematic-card.js
```

Resource type:

```text
JavaScript module
```

## Add Test Card

Paste the contents of `examples/demo-payloads/minimal.hsc1.txt` into `payload`:

```yaml
type: custom:ha-schematic-card
title: Schematic Demo
min_height: 360px
payload: hsc1....
```

The demo references `sensor.demo_temperature`. If that entity does not exist, the card should still render using the payload fallback value.

The card exposes default Home Assistant grid sizing hints for the Sections view. You can still resize the card manually in the dashboard, and `min_height` can be adjusted or omitted.

## Theme Variables

The card config editor includes a "Copy current theme variables" button. It copies selected Home Assistant CSS variables as JSON for use in a future external editor preview. This does not modify the payload.
