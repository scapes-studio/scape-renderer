import minimist from 'minimist'
import COLLECTION from './../data/COLLECTION.json'  assert { type: 'json' }
import Merge from './Merge.mjs'
import ScapeFactory from './ScapeFactory.mjs'

const options = minimist(process.argv.slice(2))
const MERGE = options.merge
const ID = options.id
const DEFAULT_HEIGHT = 24
const HEIGHT = options.height || DEFAULT_HEIGHT
const SKIP_LANDMARKS = options['skip-landmarks'] || false
const BUMP_SUNS = options['bump-suns'] || false
const UPSCALE = options['upscale'] || false

const renderScape = async (id) => {
  const scape = ScapeFactory.create(id).setHeight(HEIGHT)

  if (SKIP_LANDMARKS) {
    scape.skipLandmarks()
  }

  if (BUMP_SUNS) {
    scape.bumpSuns()
  }

  if (UPSCALE) {
    const width = typeof UPSCALE === 'number' ? UPSCALE : undefined
    scape.upscale(width)
  }

  return await scape.render()
}

const run = async () => {
  if (MERGE) {
    const merge = Merge.fromCommand(MERGE)
    await merge.render()
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
