# ha-schematic-card

A generic Home Assistant Lovelace custom card for SD/SCADA-like schematic diagrams.

## Status

This project is in early development. The repository currently contains only the initial project scaffold and package structure.

The first goal is to establish a small, reviewable project foundation. It is not a working Home Assistant card yet, and the editor app has not been implemented.

The repository now includes an initial TypeScript workspace setup for the shared packages.

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

## Commands

- `npm install`
- `npm run check`
- `npm run build`
- `npm test`

`npm run build` creates the early browser-ready Lovelace resource at `packages/card/dist/ha-schematic-card.js`. Full HACS release packaging is not implemented yet.

For a minimal manual Home Assistant test flow, see `docs/manual-home-assistant-test.md`. Demo payload fixtures live in `examples/demo-payloads`.
