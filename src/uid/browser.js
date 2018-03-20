import { keyToId } from '../id'
const uniq = global.navigator.userAgent + global.navigator.language
export default () => keyToId(`b-${Date.now()}-${(Math.random() * 10000) | 0}-${uniq}`)
