import { keyToId } from '../id'
const uniq = process.pid
export default () => keyToId(`b-${Date.now()}-${(Math.random() * 10000) | 0}-${uniq}`)
