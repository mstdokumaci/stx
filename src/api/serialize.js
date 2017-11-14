import { getString } from '../cache'
import { getFromLeaves } from './get'
import { children } from './array'

const inspect = (branch, leaf) => {
  let val = leaf.val
  const subLeaves = children(branch, leaf)
  const start = 'Struct ' + (leaf.key ? getString(leaf.key) + ' ' : '')
  const origin = leaf.rT && getFromLeaves(branch, leaf.rT)
  if (origin) {
    val = inspect(branch, origin)
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
  let val = leaf.val
  const origin = leaf.rT && getFromLeaves(branch, leaf.rT)
  if (origin) {
    val = [ '@' ].concat(origin.path())
  }
  let child = false
  const result = {}
  children(branch, leaf, subLeaf => {
    const keyResult = serialize(branch, subLeaf)
    if (keyResult !== void 0) {
      child = true
      result[getString(subLeaf.key)] = keyResult
    }
  })
  if (child) {
    if (val !== void 0) {
      result.val = val
    }
    return result
  } else if (val !== void 0) {
    return val
  }
}

export { inspect, serialize }
