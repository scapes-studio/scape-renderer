import yaml from 'yaml'
import fs from 'fs'
import sharp from 'sharp'

import COLLECTION from './../data/COLLECTION.json'  assert { type: 'json' }
import LANDMARKS from '../data/LANDMARKS.json'  assert { type: 'json' }
import VARIATIONS from './../data/VARIATIONS.json'  assert { type: 'json' }
import VARIATION_TYPES from './../data/VARIATION_TYPES.json'  assert { type: 'json' }
import SORTING from './../data/SORTING.json'  assert { type: 'json' }

const ELEMENT_CONFIG = yaml.parse(fs.readFileSync('data/base_traits/config.yaml').toString())
const DEFAULT_WIDTH = 72
const DEFAULT_HEIGHT = 24

export default class Scape {

  constructor (id) {
    this.id = id
    this.attributes = COLLECTION.find(s => s.id === id).attributes
    this.variations = VARIATIONS[id]
    this.width = DEFAULT_WIDTH
    this.height = DEFAULT_HEIGHT
  }

  setHeight (height) {
    this.height = height

    return this
  }

  getAttribute (type, key = 'trait_type') {
    return this.attributes.find((a) => a[key] === type)
  }

  isLandmark (type) { return LANDMARKS.includes(type) }

  get landMarkCount () {
    return this.attributes.reduce((count, attribute) => {
      if (this.isLandmark(attribute.trait_type)) {
        count += 1
      }
      return count
    }, 0)
  }

  get hasPlanet () {
    return !! this.getAttribute('Planet')
  }

  get hasUFO () {
    return !! this.getAttribute('UFO', 'value')
  }

  get hasCity () {
    return !! this.getAttribute('City')
  }

  get landScapeType () {
    return this.getAttribute('Landscape')?.value
  }

  get hasLandscape () {
    return !! this.landScapeType
  }

  get layers () {
    return this.attributes
      .filter(t => ! t.display_type) // Filter out date
      .map((trait, index, attributes) => {
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
        if (variations && VARIATIONS[this.id]) {
          version = VARIATIONS[this.id].find(v => v.trait_type === trait.trait_type).version

          fileName = variations[version]
        }

        const traitConfig = ELEMENT_CONFIG[trait.trait_type]?._config
        const elementConfig = ELEMENT_CONFIG[trait.trait_type]?.[fileName]

        return {
          input: `data/base_traits/${trait.trait_type}/${fileName}.png`,
          left: elementConfig?.x || 0,
          top: elementConfig?.y || 0,
          width: elementConfig?.width || DEFAULT_WIDTH,
          height: elementConfig?.height || DEFAULT_HEIGHT,
          z_index: traitConfig.zIndex,
          trait_type: trait.trait_type,
          value: trait.value,
          version,
        }
      })
      .filter(l => !! l) // Remove empty traits (e.g. topology)
      .sort((a, b) => {
        const aIndex = SORTING.findIndex(i => i === a.trait_type)
        const bIndex = SORTING.findIndex(i => i === b.trait_type)
        return aIndex > bIndex ? 1 : -1
      })
  }

  async render () {
    let layers = this.computeDefaultOffsets(this.layers)
    await this.computeCustomHeightOffsets(layers)
    await this.prepareLayers(layers)

    try {
      const image = await sharp({
        create: {
          width: this.width,
          height: this.height,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 1 },
        }
      }).png()

      await image.composite(layers)

      fs.writeFileSync(`dist/${this.id}.png`, await image.toBuffer())

      console.log(`RENDERED SCAPE #${this.id}`)
    } catch (e) {
      console.error(`IMAGE RENDERING ERROR FOR SCAPE #${this.id}`)
      console.log(e, layers)
    }
  }

  async prepareLayers (layers) {
    for (const layer of layers) {
      if (layer.input.includes('flipped')) {
        layer.input = await sharp(layer.input.replace('.flipped', '')).flop().toBuffer()
      }

      if (layer.height > this.height) {
        const area = {
          left: layer.left < 0 ? Math.abs(layer.left) : 0,
          top: layer.top < 0 ? Math.abs(layer.top) : 0,
          width: layer.left < 0 ? layer.left + layer.width : layer.width,
          height: Math.min(this.height, layer.height - Math.abs(layer.top)),
        }
        if (layer.top < 0) {
          layer.top = 0
        }
        if (layer.left < 0) {
          layer.left = 0
        }
        layer.input = await sharp(layer.input).extract(area).toBuffer()
      }
    }

    return layers
  }

  computeDefaultOffsets (layers) {
    if (
      this.landMarkCount > 1 &&
      (
        (this.hasPlanet && !this.hasLandscape) ||
        this.landScapeType === 'Lowland' ||
        this.landScapeType === 'Island'
      )
    ) {
      layers[layers.length - 2].left -=8
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

    const hasBeam = layers[layers.length - 1].version === 1
    if (this.hasUFO && !this.hasPlanet && !this.hasLandscape && !this.hasCity) {
      layers[layers.length - 1].top += hasBeam ? 2 : 4
    }

    return layers
  }

  async computeCustomHeightOffsets (layers) {
    const DIFF = this.height - DEFAULT_HEIGHT
    const HALF = parseInt(DIFF / 2)

    for (const [index, layer] of layers.entries()) {
      if (layer.trait_type === 'Atmosphere' && this.height > DEFAULT_HEIGHT) {
        layers[index].input = await sharp(layer.input)
          .resize(DEFAULT_WIDTH, this.height, { kernel: 'nearest' })
          .toBuffer()
        layers[index].height = this.height
      } else if (layer.trait_type === 'Sky') {
        layers[index].tile = true
      } else if (layer.trait_type === 'Celestial') {
        if (layer.value.includes('Clouds')) {
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
