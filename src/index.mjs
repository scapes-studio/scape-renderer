import COLLECTION from './../data/COLLECTION.json'  assert { type: 'json' }
import Scape from './Scape.mjs'

const run = async () => {
  // return await (new Scape(1001)).render()
  for (const scape of COLLECTION) {
    await (new Scape(scape.id)).render()
  }
}

run()
