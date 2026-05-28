# ha-schematic-card

A generic Home Assistant Lovelace custom card for SD/SCADA-like schematic diagrams.

## Status

This project is in early development. The repository currently contains only the initial project scaffold and package structure.

The first goal is to establish a small, reviewable project foundation. It is not a working Home Assistant card yet, and the editor app has not been implemented.

## Intended Architecture

- HACS-compatible Lovelace custom card for Home Assistant
- Separate editor/generator app for creating schematic payloads
- Shared schema package for payload structure and validation
- Shared codec package for encoding and decoding payloads
- Shared renderer package for safe SVG rendering logic
- Shared symbols package for reusable schematic symbols

## Workspaces

- `apps/editor` - future external schematic editor/generator
- `packages/schema` - future payload schema definitions
- `packages/codec` - future payload encoding and decoding
- `packages/renderer` - future safe SVG rendering logic
- `packages/symbols` - future reusable symbol library
- `packages/card` - future Home Assistant Lovelace card package
