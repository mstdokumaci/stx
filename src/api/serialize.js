import { getString } from '../cache'
import { getVal } from './compute'
import { children } from './array'

const inspect = (branch, leaf) => {
  const subLeaves = children(branch, leaf)
  const start = 'Struct ' + (leaf.key ? getString(leaf.key) + ' ' : '')
  let val = getVal(branch, leaf.id)
  if (val && val.isLeaf) {
    val = inspect(branch, val)
  }
  if (subLeaves.length) {
    let keys = []
    if (subLeaves.length > 10) {
      const len = subLeaves.length
      keys = subLeaves.slice(0, 5).map(child => getString(child.key))
      keys.push(`... ${len - 5} more items`)
    } else {
      keys = subLeaves.map(child => getString(child.key))
    }
    return val
      ? `${start}{ val: ${val}, ${keys.join(', ')} }`
      : `${start}{ ${keys.join(', ')} }`
  } else {
    return val
      ? `${start}{ val: ${val} }`
      : `${start}{ }`
  }
}

const serialize = (branch, leaf) => {
  let val = getVal(branch, leaf.id)
  if (val && val.isLeaf) {
    val = [ '@' ].concat(val.path())
  }
  let child = false
  const result = {}
  children(branch, leaf, subLeaf => {
    child = true
    result[getString(subLeaf.key)] = serialize(branch, subLeaf)
  })
  if (child) {
    if (val !== void 0) {
      result.val = val
    }
    return result
  } else if (val !== void 0) {
    return val
  } else {
    return {}
  }
}

export { inspect, serialize }
