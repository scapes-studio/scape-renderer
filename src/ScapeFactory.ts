// @ts-nocheck
import COLLECTION from './../data/COLLECTION.json'
import VARIATIONS from './../data/VARIATIONS.json'
import Scape from './Scape'

export default class ScapeFactory {

  static create (id) {
    return new Scape({
      id,
      attributes: COLLECTION.find(s => s.id === parseInt(id)).attributes,
      variations: VARIATIONS[id],
    })
  }
}
