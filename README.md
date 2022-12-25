# Scape Renderer

A simple script to render Scapes based on [Scape Element](https://opensea.io/collection/scape-elements) and [Scape Archive](https://medium.com/scapes-eth/welcome-to-the-scapes-archive-8d41b9237359) assets.

## Setup
1. Clone this repo
2. Make sure you have `node` and `yarn` installed
3. Run `yarn` to install libraries

## Rendering images
- `npx ts-node src/index.ts --id=123` "Render Scape #123 at its default dimensions"
- `npx ts-node src/index.ts --id=123 --height=32` "Render Scape #123 at 32px height"
- `npx ts-node src/index.ts` "Render all Scapes at their default dimensions"
- `npx ts-node src/index.ts --height=32` "Render all Scapes with a height of 32px"

## Options
- `--skip-landmarks`: Don't render things like Buildings, Cars, etc.
- `--bump-suns`: Use bigger assets for Sunset and Big Shades Celestials
- `--height={123}`: Set a custom height for the render
- `--upscale`: Upscale the output to 1440px width
- `--upscale={123}`: Upscale the output to {123}px width
