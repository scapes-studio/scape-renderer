import fs from 'fs'
import minimist from 'minimist'
import sharp from 'sharp'

const options = minimist(process.argv.slice(2), {
  string: ['input', 'output'],
  alias: { i: 'input', o: 'output' }
})

const INPUT = options.input
const OUTPUT = options.output

async function pngToHex(inputPath: string): Promise<string> {
  const { data } = await sharp(inputPath)
    .flatten({ background: { r: 0, g: 0, b: 0 } })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true })

  return data.toString('hex')
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
