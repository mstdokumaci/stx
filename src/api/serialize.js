import { getString } from '../cache'
import { getValOrRef } from './compute'
import { children } from './array'
import { root } from '../id'
import { getFromLeaves } from './get'

const path = (branch, id) => {
  const path = []
  while (id !== root) {
    const leafBranch = getFromLeaves(branch, id)
    path.unshift(getString(leafBranch[id].key))
    id = leafBranch[id].parent
  }
  return path
}

const inspect = (branch, leaf) => {
  const subLeaves = children(branch, leaf)
  const start = 'Struct ' + (leaf.key ? getString(leaf.key) + ' ' : '')
  let val = getValOrRef(branch, leaf.id)
  if (val && val.key) {
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
  let val = getValOrRef(branch, leaf.id)
  if (val && val.key) {
    val = [ '@' ].concat(path(branch, val))
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

export { path, inspect, serialize }
