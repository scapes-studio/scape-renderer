import COLLECTION from './../data/COLLECTION.json'  assert { type: 'json' }
import VARIATIONS from './../data/VARIATIONS.json'  assert { type: 'json' }
import Scape from './Scape.mjs'

export default class ScapeFactory {

  static create (id) {
    return new Scape({
      id,
      attributes: COLLECTION.find(s => s.id === parseInt(id)).attributes,
      variations: VARIATIONS[id],
    })
  }
}
