# Scape Renderer

A simple script to render Scapes based on [Scape Element](https://opensea.io/collection/scape-elements) and [Scape Archive](https://medium.com/scapes-eth/welcome-to-the-scapes-archive-8d41b9237359) assets.

## Setup
1. Clone this repo
2. Make sure you have `node` and `pnpm` installed
3. Run `pnpm install` to install libraries

## Rendering images
- `pnpm run generate --id=123` "Render Scape #123 at its default dimensions"
- `pnpm run generate --id=123 --height=32` "Render Scape #123 at 32px height"
- `pnpm run generate` "Render all Scapes at their default dimensions"
- `pnpm run generate --height=32` "Render all Scapes with a height of 32px"

## Merging Scapes
- `pnpm run generate --merge=123+456` "Merge Scapes #123 and #456"
- `pnpm run generate --merge-id=abc123` "Render a merge by its ID"

## Converting to hex
- `pnpm run png-to-hex` "Convert rendered PNGs to hex format"

## Options
- `--id={123}`: Render a specific Scape by ID
- `--height={123}`: Set a custom height for the render (default: 24)
- `--width={123}`: Crop the output to a specific width
- `--offset={123}`: Set the horizontal offset when cropping
- `--skip-landmarks`: Don't render things like Buildings, Cars, etc.
- `--sun-offset={123}`: Adjust the sun position offset
- `--upscale`: Upscale the output to 1440px width
- `--upscale={123}`: Upscale the output to {123}px width
- `--merge={id1+id2}`: Merge multiple Scapes together
- `--merge-id={id}`: Render a pre-defined merge by its ID

## Send/Receive by Snowfro

To generate a valid output for [Send/Receive by Snowfro](https://www.sendreceive.org/):

1. Generate a 32x32 or 64x64 Scape PNG
2. Convert it to a hex string via the `png-to-hex` command

```bash
pnpm exec ts-node src/index.ts --id=9 --height=64 --width=64 --sun-offset=5
pnpm exec ts-node src/png-to-hex.ts --input dist/9.png
```
