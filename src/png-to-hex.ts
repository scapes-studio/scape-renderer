import fs from 'fs'
import minimist from 'minimist'
import sharp from 'sharp'

const options = minimist(process.argv.slice(2), {
  string: ['input', 'output'],
  alias: { i: 'input', o: 'output' }
})

const INPUT = options.input
const OUTPUT = options.output

// SEND/RECEIVE 256 COLOR PALETTE
const SR_PALETTE = [
  "transparent", "#000000", "#1C1C1C", "#333333", "#4D4D4D", "#666666", "#808080",
  "#999999", "#B3B3B3", "#CCCCCC", "#E6E6E6", "#F5F5F5", "#FFFFFF",
  "#FFEEDD", "#FFE4C4", "#FFDAB9", "#FFD1A4", "#FFC490", "#FFB87C", "#FFAB68",
  "#FF9F54", "#FF9340", "#F4A460", "#E5B887", "#D2A679", "#C1946A", "#AF825C",
  "#9D704E", "#8B5E3F", "#794C31", "#673A23", "#552815", "#4B2D1F", "#3E2418",
  "#321B12", "#26120B", "#1A0905",
  "#FFE0BD", "#F4D4AB", "#E9C899", "#DEBC87", "#D3B075", "#C8A463", "#BD9851",
  "#B28C3F", "#A7802D", "#9C741B", "#916809", "#865C00",
  "#2B1F0E", "#3D2F1F", "#4F3F2F", "#61513F", "#73634F", "#85755F", "#97876F",
  "#A9997F", "#BBAB8F", "#CDBD9F", "#DFCFAF", "#F1E1BF", "#FFE4B5",
  "#B87333", "#8B4513", "#A0522D", "#D2691E", "#CD853F",
  "#DEB887", "#FFDEAD", "#F5DEB3",
  "#FF0000", "#FF1A1A", "#FF3333", "#FF4D4D", "#FF6666", "#FF8080", "#FF9999",
  "#FFB3B3", "#FFCCCC", "#FFE6E6", "#E60000", "#CC0000", "#B30000", "#990000",
  "#800000", "#660000", "#4D0000", "#330000", "#1A0000", "#FF0040", "#FF0080",
  "#CC0033", "#990026",
  "#FF8000", "#E67300", "#CC6600", "#B35900", "#994D00", "#804000", "#663300",
  "#4D2600", "#1A0D00", "#FF8C1A", "#FF9933", "#FFA54D", "#FFB266",
  "#FF5500", "#FF4400", "#E64100", "#CC3700", "#B33000", "#FF6600", "#FF7F00",
  "#FF9900", "#FFB300", "#FFCC00",
  "#FFFF00", "#E6E600", "#CCCC00", "#B3B300", "#999900", "#808000", "#666600",
  "#4D4D00", "#333300", "#1A1A00", "#FFFF33", "#FFFF66", "#FFFF99", "#FFFFCC",
  "#FFE600", "#FFD700", "#FFD300", "#FFC000", "#FFAD00",
  "#00FF00", "#00E600", "#00CC00", "#00B300", "#009900", "#008000", "#006600",
  "#004D00", "#003300", "#001A00", "#1AFF1A", "#33FF33", "#4DFF4D", "#66FF66",
  "#80FF80", "#99FF99", "#B3FFB3", "#CCFFCC", "#E6FFE6", "#00FF40", "#00FF80",
  "#00CC33", "#228B22", "#32CD32", "#3CB371", "#2E8B57", "#00FF7F",
  "#00FFFF", "#00E6E6", "#00CCCC", "#00B3B3", "#009999", "#008080", "#006666",
  "#004D4D", "#003333", "#001A1A", "#1AFFFF", "#33FFFF", "#4DFFFF", "#66FFFF",
  "#80FFFF", "#99FFFF", "#B3FFFF", "#CCFFFF", "#E6FFFF", "#00CED1", "#48D1CC",
  "#20B2AA", "#5F9EA0",
  "#0000FF", "#0000E6", "#0000CC", "#0000B3", "#000099", "#000080", "#000066",
  "#00004D", "#000033", "#00001A", "#1A1AFF", "#3333FF", "#4D4DFF", "#6666FF",
  "#8080FF", "#9999FF", "#B3B3FF", "#CCCCFF", "#E6E6FF", "#0040FF", "#0080FF",
  "#1E90FF", "#4169E1", "#0000CD", "#191970", "#4B0082",
  "#8000FF", "#7300E6", "#6600CC", "#5900B3", "#4D0099", "#400080", "#330066",
  "#26004D", "#1A0033", "#0D001A", "#8C1AFF", "#9933FF", "#A54DFF", "#B266FF",
  "#BF80FF", "#CC99FF", "#D9B3FF", "#E6CCFF", "#F2E6FF", "#9400D3", "#8B008B",
  "#800080", "#663399",
  "#FF00FF", "#E600E6", "#CC00CC", "#B300B3", "#990099", "#660066",
  "#4D004D", "#330033", "#1A001A", "#FF1AFF", "#FF33FF", "#FF4DFF", "#FF66FF",
  "#FF80FF", "#FF99FF", "#FFB3FF", "#FFCCFF", "#FFE6FF", "#FF1493", "#FF69B4",
  "#FFB6C1", "#FFC0CB"
]

// Parse hex color to RGB
function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
  if (hex === "transparent") return null
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

// Precompute palette RGB values
const PALETTE_RGB = SR_PALETTE.map(hexToRgb)

// Find closest palette index using color distance
function findClosestPaletteIndex(r: number, g: number, b: number): number {
  let minDist = Infinity
  let closest = 1 // Default to black

  for (let i = 1; i < PALETTE_RGB.length; i++) {
    const color = PALETTE_RGB[i]
    if (!color) continue

    const dr = r - color.r
    const dg = g - color.g
    const db = b - color.b
    const dist = dr * dr + dg * dg + db * db

    if (dist === 0) return i // Exact match
    if (dist < minDist) {
      minDist = dist
      closest = i
    }
  }

  return closest
}

async function pngToHex(inputPath: string): Promise<string> {
  const { data } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  let hexString = ''

  // Process RGBA pixels
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]

    // If transparent, use index 0
    const paletteIndex = a < 128 ? 0 : findClosestPaletteIndex(r, g, b)
    hexString += paletteIndex.toString(16).padStart(2, '0')
  }

  return hexString
}

async function run() {
  if (!INPUT) {
    console.error('Usage: ts-node src/png-to-hex.ts --input <png-file> [--output <hex-file>]')
    process.exit(1)
  }

  const hex = await pngToHex(INPUT)

  if (OUTPUT) {
    fs.writeFileSync(OUTPUT, hex + '\n')
    console.log(`Wrote hex to ${OUTPUT}`)
  } else {
    console.log(hex)
  }
}

run()
