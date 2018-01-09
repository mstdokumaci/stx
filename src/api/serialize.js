import { getString } from '../cache'
import { getValOrRef } from './compute'
import { children } from './array'
import { root } from '../id'
import { getFromLeaves } from './get'

const path = (branch, id) => {
  const path = []
  while (id !== root) {
    const leaf = getFromLeaves(branch, id)[id]
    path.unshift(getString(leaf.key))
    id = leaf.parent
  }
  return path
}

const inspect = (branch, id) => {
  const subLeaves = children(branch, id)
  const leaf = getFromLeaves(branch, id)[id]
  const start = 'Struct ' + (leaf.key ? getString(leaf.key) + ' ' : '')
  let val = getValOrRef(branch, id)
  if (val && val.id) {
    val = inspect(branch, val.id)
  }
  if (subLeaves.length) {
    let keys = []
    if (subLeaves.length > 10) {
      const len = subLeaves.length
      keys = subLeaves.slice(0, 5).map(([ branch, id ]) => getString(branch[id].key))
      keys.push(`... ${len - 5} more items`)
    } else {
      keys = subLeaves.map(([ branch, id ]) => getString(branch[id].key))
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

const serialize = (branch, id) => {
  let val = getValOrRef(branch, id)
  if (val && val.id) {
    val = [ '@' ].concat(path(branch, val.id))
  }
  let child = false
  const result = {}
  children(branch, id, (subBranch, subId) => {
    child = true
    result[getString(subBranch[id].key)] = serialize(branch, subId)
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
