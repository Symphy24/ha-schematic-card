# Schema

Shared TypeScript schema definitions and lightweight validation helpers for decoded schematic payloads.

This is an early foundation for the future payload format. Encoded card payloads should be decoded first, then validated with this package before anything is rendered.

Renderable items include a numeric `layer`. The renderer should sort by layer later so background items, pipes, components, labels, and overlays draw in a predictable order.

The schema supports safe SVG-like primitives, including `path` as path data only. It does not allow raw SVG markup. Item transforms are structured data, not raw transform strings, so future editor-generated generic symbols can be built from safe primitives.

Payloads can also define reusable `symbols` made from the same safe primitives. A `symbol` item references one of those definitions by id and places it in the schematic. Symbol definitions are payload data, not a hardcoded domain-specific symbol library.

Items may include a simple structured `visibleWhen` condition to show an item only when a Home Assistant entity state equals a specific string. This is intentionally limited data, not executable JavaScript.

Items may also include `styleWhen` entries that apply an alternative safe style when the same kind of entity-state condition matches. Conditional styles use the same safe style fields as normal item styles.

`entityValue` items support small display helpers such as `unit`, `fallback`, `precision`, and `unavailableText`. Renderers may also use Home Assistant `unit_of_measurement` attributes when the payload does not provide a unit.

Line-like items may include a small structured `flow` animation. The first supported type is `dash`, optionally enabled by the same simple entity-state condition model.
