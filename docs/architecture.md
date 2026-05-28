# Architecture Outline

This project is expected to be split into a Home Assistant card, a separate editor app, and shared packages.

- `card` - HACS-compatible Lovelace card package for Home Assistant.
- `editor` - external schematic editor/generator app.
- `schema` - shared payload structure and validation.
- `codec` - shared encoding and decoding for payload transport.
- `renderer` - shared safe SVG rendering logic.
- `symbols` - shared schematic symbol library.
