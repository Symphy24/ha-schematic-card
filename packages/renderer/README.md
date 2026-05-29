# Renderer

Renders safe SVG DOM elements from validated `@ha-schematic-card/schema` payloads.

The renderer creates SVG nodes with `createElementNS`, sorts items by numeric `layer` before rendering, and avoids raw `innerHTML`.

It supports safe `path` data and structured transforms from the schema. It does not render raw SVG snippets or arbitrary transform strings.

It can render payload-defined reusable symbols by expanding `symbol` items into safe SVG groups. Symbol content still uses the same primitive renderer and layer sorting.

It can also apply simple `visibleWhen` entity-state conditions and `styleWhen` conditional safe styles using entity values supplied through renderer options.

It does not access Home Assistant directly.
