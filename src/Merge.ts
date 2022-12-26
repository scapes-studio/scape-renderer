// @ts-nocheck
import fs from 'fs'
import sharp from 'sharp'
import ScapeFactory from './ScapeFactory'
import LAYER_SORTING from './../data/LAYER_SORTING.json'

const SCAPE_WIDTH = 72
const SCAPE_SIZE = 14
const PART_SIZE = 16

export default class Merge {

  /**
   * @param {object} mergeConfig e.g. [[[ID, FLIP_X, FLIP_Y]], FADE]
   */
  constructor(mergeConfig) {
    this.mergeConfig = mergeConfig
  }

  static fromId(stringId) {
    const id = BigInt(stringId)

    const fade = !!(id & BigInt(1))

    const parts = []

    let mergeId = id >> BigInt(1)
    for (let i = 0; i < 15; i++) {
      const filter = (BigInt(1) << BigInt(PART_SIZE * i) + BigInt(SCAPE_SIZE)) - (BigInt(1) << BigInt(PART_SIZE * i));
      const offset = PART_SIZE * i;
      const tokenId = (mergeId & filter) >> BigInt(offset);
      const flipX = !!(mergeId & (BigInt(1) << BigInt(PART_SIZE * i) + BigInt(14)))
      const flipY = !!(mergeId & (BigInt(1) << BigInt(PART_SIZE * i) + BigInt(15)))
      if (tokenId) {
        parts.push([tokenId, flipX, flipY])
      }
    }

    return new Merge([parts, fade])
  }

  static fromCommand(command) {
    let cmds = command.split(' ')
    if (command.startsWith('!')) cmds.shift()

    const config = [
      [],
      Number(cmds[0] === 'fade'),
    ]

    for (let i = 0; i < cmds.slice(1).length; i++) {
      const id = BigInt(Number(
        cmds.slice(1)[i].match(/\d+/)[0]
      ))
      config[0].push([
        id,
        cmds.slice(1)[i].includes('h'),
        cmds.slice(1)[i].includes('v'),
      ])
    }

    return new Merge(config)
  }

  get id () {
    let mergeId = BigInt(Number(this.fade))

    this.mergeConfig[0].forEach((part, i) => {
      const id = part[0]
      const flipX = part[1]
      const flipY = part[2]

      const mergePartBytes = BigInt(id) | BigInt(flipX << 14) | BigInt(flipY << 15)
      mergeId |= mergePartBytes << BigInt(PART_SIZE * i) + BigInt(1)
    })

    return mergeId
  }

  get fade () {
    return this.mergeConfig[1]
  }

  get scapes () {
    return this.mergeConfig[0]
      .map(([id, flipX, flipY]) => [ScapeFactory.create(id), flipX, flipY])
  }

  get count () {
    return this.scapes.length
  }

  get width () {
    return this.count * SCAPE_WIDTH
  }

  get height () {
    return 24
  }

  async render () {
    const scapeLayers = await Promise.all(this.scapes.map(config => config[0].prepareLayers()))
    let layers = []

    for (const category of LAYER_SORTING) {
      for (const [index, lrs] of Object.entries(scapeLayers)) {
        const flipX = this.scapes[index][1]
        const matching = lrs.filter(l => l._trait.type === category)

        for (const l of matching) {
          const scapeOffset = SCAPE_WIDTH * index

          if (flipX) {
            l.left = SCAPE_WIDTH - l.left - l.width
            l.input = await sharp(l.input).flop().toBuffer()
          }

          if (!this.fade && l._trait.fade) {
            continue
          }

          layers.push({
            ...l,
            left: l.left + scapeOffset,
          })
        }
      }
    }

    try {
      let image = await sharp({
        create: {
          width: this.width,
          height: this.height,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 1 },
        }
      }).png()

      await image.composite(layers)

      if (this.outputWidth > this.width) {
        image = await sharp(await image.toBuffer())
          .resize(this.outputWidth, null, { kernel: 'nearest' })
      }

      this.image = await image.toBuffer()
      console.log(`RENDERED SCAPE #${this.id}`)

      return this.image
    } catch (e) {
      console.error(`IMAGE RENDERING ERROR FOR SCAPE #${this.id}`)
      console.log(e, layers)
    }
  }

  save (distPath = `dist/${this.id}.png`) {
    fs.writeFileSync(distPath, this.image)
    console.log(`RENDERED SCAPE #${this.id}`)
  }

}
