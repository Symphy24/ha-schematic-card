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
payload: hsc1....
```

The demo references `sensor.demo_temperature`. If that entity does not exist, the card should still render using the payload fallback value.
