# Renderer

Renders safe SVG DOM elements from validated `@ha-schematic-card/schema` payloads.

The renderer creates SVG nodes with `createElementNS`, sorts items by numeric `layer` before rendering, and avoids raw `innerHTML`.

It does not access Home Assistant directly. Entity values are supplied through renderer options.
