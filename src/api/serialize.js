import { root } from '../id'
import { getString } from '../cache'

const path = (branch, id) => {
  const path = []
  while (id !== root) {
    path.unshift(getString(branch.leaves[id].key))
    id = branch.leaves[id].parent
  }
  return path
}

const inspect = (branch, id) => {
  const subLeaves = []
  const start = 'stx ' + (branch.leaves[id].key ? getString(branch.leaves[id].key) + ' ' : '')
  let val
  if (branch.leaves[id]) {
    val = branch.leaves[id].rT
      ? inspect(branch, branch.leaves[id].rT)
      : branch.leaves[id].val

    for (const key in branch.leaves[id].keys) {
      if (key in branch.leaves && branch.leaves[key] !== null) {
        subLeaves.push(key)
      }
    }
  }
  if (subLeaves.length) {
    let keys = []
    if (subLeaves.length > 10) {
      const len = subLeaves.length
      keys = subLeaves.slice(0, 5).map(id => getString(branch.leaves[id].key))
      keys.push(`... ${len - 5} more items`)
    } else {
      keys = subLeaves.map(id => getString(branch.leaves[id].key))
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
  let val
  let child = false
  const result = {}
  if (branch.leaves[id]) {
    val = branch.leaves[id].rT
      ? ['@', ...path(branch, branch.leaves[id].rT)]
      : branch.leaves[id].val

    for (const key in branch.leaves[id].keys) {
      if (key in branch.leaves && branch.leaves[key] !== null) {
        child = true
        result[getString(branch.leaves[key].key)] = serialize(branch, key)
      }
    }
  }
  if (child) {
    if (val !== undefined) {
      result.val = val
    }
    return result
  } else if (val !== undefined) {
    return val
  } else {
    return {}
  }
}

export { path, inspect, serialize }
