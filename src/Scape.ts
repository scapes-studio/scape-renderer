// @ts-nocheck
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

import LANDMARKS from './../data/LANDMARKS.json'
import VARIATION_TYPES from './../data/VARIATION_TYPES.json'
import SORTING from './../data/SORTING.json'
import FADES from './../data/FADES.json'
import ELEMENT_CONFIG from './../data/ELEMENTS.json'

const DEFAULT_WIDTH = 72
const DEFAULT_HEIGHT = 24

export default class Scape {

  constructor({
    id,
    attributes,
    variations,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
    includeLandmarks = true,
    sunOffset = null,
    outputWidth = DEFAULT_WIDTH,
  }) {
    this.id = id
    this.attributes = attributes
    this.variations = variations
    this.width = width
    this.height = height
    this.includeLandmarks = includeLandmarks
    this.sunOffset = sunOffset
    this.outputWidth = outputWidth
  }

  setHeight(height) {
    this.height = height

    return this
  }

  upscale(times = 15) {
    this.outputWidth = this.width * times
  }

  skipLandmarks() {
    this.includeLandmarks = false
  }

  setSunOffset(offset) {
    this.sunOffset = offset
  }

  getAttribute(type, key = 'trait_type') {
    return this.attributes.find((a) => a[key] === type)
  }

  isLandmark(type) { return LANDMARKS.includes(type) }

  get landMarkCount() {
    return this.attributes.reduce((count, attribute) => {
      if (this.isLandmark(attribute.trait_type)) {
        count += 1
      }
      return count
    }, 0)
  }

  get hasPlanet() {
    return !!this.getAttribute('Planet')
  }

  get hasUFO() {
    return !!this.getAttribute('UFO', 'value')
  }

  get hasCity() {
    return !!this.getAttribute('City')
  }

  get landScapeType() {
    return this.getAttribute('Landscape')?.value
  }

  get hasLandscape() {
    return !!this.landScapeType
  }

  get layers() {
    const layers = []

    this.attributes
      .filter(t => !t.display_type) // Filter out date
      .forEach((trait, index, attributes) => {
        let fileName = trait.value

        // Handle Planets + Topology
        if (trait.trait_type === 'Planet') {
          fileName = [attributes[index + 1].value, trait.value].join(' ')
        }
        if (trait.trait_type === 'Topology') return

        // Handle Landscape + Surface
        if (trait.trait_type === 'Landscape') {
          fileName = [attributes[index + 1].value, trait.value].join(' ')
        }
        if (trait.trait_type === 'Surface') return

        // Handle random image sets
        const variations = VARIATION_TYPES[fileName]
        let version = 0
        if (variations && this.variations) {
          version = this.variations.find(v => v.trait_type === trait.trait_type).version

          fileName = variations[version]
        }

        const traitConfig = ELEMENT_CONFIG[trait.trait_type]?._config
        const elementConfig = ELEMENT_CONFIG[trait.trait_type]?.[fileName]

        layers.push({
          input: path.resolve(__dirname, `../data/base_traits/${trait.trait_type}/${fileName}.png`),
          left: elementConfig?.x || 0,
          top: elementConfig?.y || 0,
          width: elementConfig?.width || DEFAULT_WIDTH,
          height: elementConfig?.height || DEFAULT_HEIGHT,
          z_index: traitConfig.zIndex,
          _trait: {
            type: trait.trait_type,
            value: trait.value,
          },
          version,
        })

        // Add Fades
        const fadedCategory = FADES[trait.trait_type]
        const leftName = `${fileName} left`
        const rightName = `${fileName} right`
        if (fadedCategory) {
          const leftConfig = fadedCategory[leftName]
          if (leftConfig) layers.push({
            input: path.resolve(__dirname, `../data/base_traits/${trait.trait_type}/${leftName}.png`),
            left: leftConfig?.x || 0,
            top: leftConfig?.y || 0,
            width: 24,
            height: 24,
            z_index: leftConfig.zIndex,
            _trait: {
              type: trait.trait_type,
              value: trait.value,
              fade: true,
            },
          })

          const rightConfig = fadedCategory[rightName]
          if (rightConfig) layers.push({
            input: path.resolve(__dirname, `../data/base_traits/${trait.trait_type}/${rightName}.png`),
            left: rightConfig?.x || 0,
            top: rightConfig?.y || 0,
            width: 24,
            height: 24,
            z_index: rightConfig.zIndex,
            _trait: {
              type: trait.trait_type,
              value: trait.value,
              fade: true,
            },
          })
        }
      })

    return layers
      .filter(l => !!l) // Remove empty traits (e.g. topology)
      .sort((a, b) => {
        const aIndex = SORTING.findIndex(i => i === a._trait.type)
        const bIndex = SORTING.findIndex(i => i === b._trait.type)
        return aIndex > bIndex ? 1 : -1
      })
  }

  async render() {
    let layers = await this.prepareLayers()

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

      if (this.outputWidth > DEFAULT_WIDTH) {
        image = await sharp(await image.toBuffer())
          .resize(this.outputWidth, null, { kernel: 'nearest' })
      }

      this.image = await image.toBuffer()
      fs.writeFileSync(`dist/${this.id}.png`, this.image)

      console.log(`RENDERED SCAPE #${this.id}`)
    } catch (e) {
      console.error(`IMAGE RENDERING ERROR FOR SCAPE #${this.id}`)
      console.log(e, layers)
    }
  }

  async crop(targetWidth, offset = null) {
    if (!this.image) {
      await this.render()
    }

    const metadata = await sharp(this.image).metadata()
    const currentWidth = metadata.width
    const left = offset !== null ? offset : Math.floor((currentWidth - targetWidth) / 2)

    this.image = await sharp(this.image)
      .extract({ left, top: 0, width: targetWidth, height: metadata.height })
      .toBuffer()

    return this
  }

  save(distPath = `dist/${this.id}.png`) {
    fs.writeFileSync(distPath, this.image)
  }

  async prepareLayers() {
    let layers = this.computeDefaultOffsets(this.layers)
    if (this.height > DEFAULT_HEIGHT) {
      await this.computeCustomHeightOffsets(layers)
    }

    for (const layer of layers) {
      if (layer.input.includes('flipped')) {
        layer.input = await sharp(layer.input.replace('.flipped', '')).flop().toBuffer()
      }

      if (this.sunOffset !== null && ['Sunset', 'Big Shades'].includes(layer._trait.value)) {
        const dimension = 56
        layer.input = layer.input.replace('.png', `@${dimension}.png`)
        layer.width = dimension
        layer.height = dimension
        layer.left = Math.floor((this.width - dimension) / 2)
        layer.top = layer.top + this.sunOffset
      }

      if ((this.hasPlanet || this.hasLandscape || this.hasCity) &&
        ['Sunset', 'Big Shades'].includes(layer._trait.value) && this.height >= 56
      ) {
        layer.top = layer.top + 4
      }

      if (layer.height > this.height || layer.width > this.width) {
        const area = {
          left: 0,
          top: layer.top < 0 ? Math.abs(layer.top) : 0,
          width: layer.width,
          height: Math.min(this.height, layer.height - Math.abs(layer.top)),
        }
        if (layer.top < 0) {
          layer.top = 0
        }
        layer.input = await sharp(layer.input).extract(area).toBuffer()
      }
    }

    // Final sort and filter...
    return layers
      .sort((a, b) => a.z_index > b.z_index ? 1 : -1)
      .filter(l => {
        if (!this.includeLandmarks && LANDMARKS.includes(l._trait.type)) return false

        return true
      })
  }

  computeDefaultOffsets(layers) {
    if (
      this.landMarkCount > 1 &&
      (
        (this.hasPlanet && !this.hasLandscape) ||
        this.landScapeType === 'Lowland' ||
        this.landScapeType === 'Island'
      )
    ) {
      layers[layers.length - 2].left -= 8
      layers[layers.length - 1].left += 8
    }

    if (this.landScapeType === 'Hill') {
      if (this.landMarkCount === 1) {
        layers[layers.length - 1].left += 20
      } else if (this.landMarkCount === 2) {
        layers[layers.length - 2].left += 16
        layers[layers.length - 1].left += 26
      }
    }

    if (this.landScapeType === 'Valley') {
      if (this.landMarkCount === 1) {
        layers[layers.length - 1].left += 18
      } else if (this.landMarkCount === 2) {
        layers[layers.length - 2].left += 16
        layers[layers.length - 1].left += 26
      }
    }

    if (this.landScapeType === 'Beach') {
      if (this.landMarkCount === 1) {
        layers[layers.length - 1].left += 20
      } else if (this.landMarkCount === 2) {
        layers[layers.length - 2].left += 12
        layers[layers.length - 1].left += 26
      }
    }

    if (this.landScapeType === 'Lagoon') {
      if (this.landMarkCount === 1) {
        layers[layers.length - 1].left += 24
      } else if (this.landMarkCount === 2) {
        layers[layers.length - 2].left += 16
        layers[layers.length - 1].left += 28
      }
    }

    const hasBeam = this.hasUFO && layers[layers.length - 1].version === 1
    if (this.hasUFO && !this.hasPlanet && !this.hasLandscape && !this.hasCity) {
      layers[layers.length - 1].top += hasBeam ? 2 : 4
    }

    const isFlying = hasBeam ||
      layers[layers.length - 1]._trait.value.startsWith('Shuttle') ||
      layers[layers.length - 1]._trait.value.startsWith('Spacelab')
    if (isFlying && this.height > DEFAULT_HEIGHT) {
      layers[layers.length - 1].top -= (this.height / 2 - 16)
    }

    return layers
  }

  async computeCustomHeightOffsets(layers) {
    const DIFF = this.height - DEFAULT_HEIGHT
    const HALF = parseInt(DIFF / 2)

    for (const [index, layer] of layers.entries()) {
      if (this.height > DEFAULT_HEIGHT && layer._trait.type === 'Atmosphere' && !layer._trait.fade) {
        layers[index].input = await sharp(layer.input)
          .resize(DEFAULT_WIDTH, this.height, { kernel: 'nearest' })
          .toBuffer()
        layers[index].height = this.height
      } else if (layer._trait.type === 'Sky' && !layer._trait.fade) {
        layers[index].tile = true
      } else if (layer._trait.type === 'Celestial' && !layer._trait.fade) {
        if (layer._trait.value.includes('Clouds')) {
          layers[index].tile = true
        } else {
          layers[index].top = layer.top + HALF
        }
      } else {
        layers[index].top = layer.top + DIFF
      }
    }

    return layers
  }
}
