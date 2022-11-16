# Scape Renderer

A simple script to render Scapes based on [Scape Element](https://opensea.io/collection/scape-elements) and [Scape Archive](https://medium.com/scapes-eth/welcome-to-the-scapes-archive-8d41b9237359) assets.

## Setup
1. Clone this repo
2. Make sure you have `node` and `npm` installed
3. Run `npm install` to install libraries

## Rendering images
- `node src/index --id=123` "Render Scape #123 at its default dimensions"
- `node src/index --id=123 --height=32` "Render Scape #123 at 32px height"
- `node src/index` "Render all Scapes at their default dimensions"
- `node src/index --height=32` "Render all Scapes with a height of 32px"
