import fs from 'fs'
import sharp from 'sharp'
import variations from './../data/variations.json'
import collection from './../data/collection.json'

export default class Scape {
  width = 72
  height = 24

  constructor (id) {
    this.id = id
  }

  setHeight (height) {
    this.height = height

    return this
  }

  async render () {

  }
}
