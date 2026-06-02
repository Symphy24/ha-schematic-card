# Renderer

Renders safe SVG DOM elements from validated `@ha-schematic-card/schema` payloads.

The renderer creates SVG nodes with `createElementNS`, sorts items by numeric `layer` before rendering, and avoids raw `innerHTML`.

It supports safe `path` data and structured transforms from the schema. It does not render raw SVG snippets or arbitrary transform strings.

It can render payload-defined reusable symbols by expanding `symbol` items into safe SVG groups. Symbol content still uses the same primitive renderer and layer sorting. Symbol `parts`, internal item `partId`, `partStyles`, `partAnimations`, and `entitySlots` remain structured data, while instance `slotBindings` can resolve safe condition references such as `slot:alarm` for existing `visibleWhen`, `styleWhen`, `flow`, `entityValue`, part-level dynamic styles, and part-level animation presets. The renderer does not execute payload logic or inject markup.

It can also apply simple `visibleWhen` entity-state conditions and `styleWhen` conditional safe styles using entity values supplied through renderer options.

`entityValue` rendering supports simple numeric precision, fallback text for unavailable states, explicit payload units, and Home Assistant `unit_of_measurement` attributes.

Line-like items can render a safe dashed `flow` animation from structured payload data. The renderer generates the animation CSS itself and does not accept raw CSS from payloads.

Symbol parts can use safe renderer-owned animation presets: `blink`, `pulse`, and `rotate`. Payloads choose the preset and condition; they do not provide custom JavaScript or raw CSS.

It does not access Home Assistant directly.
