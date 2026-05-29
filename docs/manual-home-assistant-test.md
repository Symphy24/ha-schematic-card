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

The demo references `input_number.schematic_demo_temperature`. To test live value formatting, create a Home Assistant number helper named `schematic_demo_temperature`, set a value such as `21.26`, and optionally set its unit to `C`.

Expected behavior:

- The value is displayed with one decimal place, for example `21.3 C`.
- If the entity does not exist or is unavailable, the card should still render using the payload fallback value.

## Conditional Visibility And Style Demo

The demo also includes a status indicator controlled by `input_boolean.schematic_demo_alarm`.

The red `ALARM` badge is controlled by:

```yaml
visibleWhen:
  entityId: input_boolean.schematic_demo_alarm
  equals: "on"
```

The round status dot also changes style with:

```yaml
styleWhen:
  - when:
      entityId: input_boolean.schematic_demo_alarm
      equals: "on"
    style:
      fill: var(--error-color)
```

To test it manually, create a Home Assistant toggle helper named `schematic_demo_alarm`, which appears as `input_boolean.schematic_demo_alarm`, or temporarily adjust the payload to point at an entity you already have.

Expected behavior:

- When `input_boolean.schematic_demo_alarm` is `on`, the status dot changes to the error color and the red `ALARM` badge appears near the right side of the schematic.
- When `input_boolean.schematic_demo_alarm` is `off`, unavailable, or missing, the status dot stays in the success color and the badge is hidden.

## Flow Animation Demo

The main flow line has a safe dashed flow animation controlled by:

```yaml
flow:
  type: dash
  durationSeconds: 1.5
  enabledWhen:
    entityId: input_boolean.schematic_demo_flow
    equals: "on"
```

To test it manually, create a Home Assistant toggle helper named `schematic_demo_flow`, which appears as `input_boolean.schematic_demo_flow`.

Expected behavior:

- When `input_boolean.schematic_demo_flow` is `on`, the main flow line shows a moving dashed flow indication.
- When it is `off`, unavailable, or missing, the flow line is rendered as a normal static line.

## Theme Variables

The card config editor includes a "Copy current theme variables" button. It copies selected Home Assistant CSS variables as JSON for use in a future external editor preview. This does not modify the payload.
