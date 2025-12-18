import minimist from 'minimist'
import collectionData from '../data/COLLECTION.json'
import Merge from './Merge'
import ScapeFactory from './ScapeFactory'
import { MetaData } from './types'

const COLLECTION = collectionData as MetaData[]

const options = minimist(process.argv.slice(2), {
  string: ['merge-id']
})
const MERGE = options.merge
const MERGE_ID = options['merge-id']
const ID = options.id
const DEFAULT_HEIGHT = 24
const HEIGHT = options.height || DEFAULT_HEIGHT
const SKIP_LANDMARKS = options['skip-landmarks'] || false
const SUN_OFFSET = options['sun-offset']
const UPSCALE = options['upscale'] || false
const WIDTH = options['width'] || false
const OFFSET = options['offset']

const renderScape = async (id) => {
  const scape = ScapeFactory.create(id).setHeight(HEIGHT)

  if (SKIP_LANDMARKS) {
    scape.skipLandmarks()
  }

  if (SUN_OFFSET !== undefined) {
    scape.setSunOffset(SUN_OFFSET)
  }

  if (UPSCALE) {
    const times = typeof UPSCALE === 'number' ? UPSCALE : undefined
    scape.upscale(times)
  }

  await scape.render()

  if (WIDTH) {
    await scape.crop(WIDTH, OFFSET !== undefined ? OFFSET : null)
    scape.save()
  }
}

const run = async () => {
  if (MERGE || MERGE_ID) {
    const merge = MERGE ? Merge.fromCommand(MERGE) : Merge.fromId(MERGE_ID)

    if (UPSCALE) {
      const times = typeof UPSCALE === 'number' ? UPSCALE : undefined
      merge.upscale(times)
    }

    await merge.render()

    if (WIDTH) {
      await merge.crop(WIDTH, OFFSET !== undefined ? OFFSET : null)
    }

    await merge.save()
    return
  }

  if (ID) {
    return await renderScape(ID)
  }

  for (const item of COLLECTION) {
    await renderScape(item.id)
  }
}

run()
