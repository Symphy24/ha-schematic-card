# Schema

Shared TypeScript schema definitions and lightweight validation helpers for decoded schematic payloads.

This is an early foundation for the future payload format. Encoded card payloads should be decoded first, then validated with this package before anything is rendered.

Renderable items include a numeric `layer`. The renderer should sort by layer later so background items, pipes, components, labels, and overlays draw in a predictable order.
