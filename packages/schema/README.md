# Schema

Shared TypeScript schema definitions and lightweight validation helpers for decoded schematic payloads.

This is an early foundation for the future payload format. Encoded card payloads should be decoded first, then validated with this package before anything is rendered.

Renderable items include a numeric `layer`. The renderer should sort by layer later so background items, pipes, components, labels, and overlays draw in a predictable order.

The schema supports safe SVG-like primitives, including `path` as path data only. It does not allow raw SVG markup. Item transforms are structured data, not raw transform strings, so future editor-generated generic symbols can be built from safe primitives.

Payloads can also define reusable `symbols` made from the same safe primitives. A `symbol` item references one of those definitions by id and places it in the schematic. Symbol definitions are payload data, not a hardcoded domain-specific symbol library.
