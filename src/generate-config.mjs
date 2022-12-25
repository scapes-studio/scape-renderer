import yaml from 'yaml'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ELEMENT_CONFIG = yaml.parse(fs.readFileSync(
  path.resolve(__dirname, './../data/base_traits/config.yaml')
).toString())

fs.writeFileSync('data/ELEMENTS.json', JSON.stringify(ELEMENT_CONFIG, null, 4))
