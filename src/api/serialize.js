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

const inspect = (branch, leaf) => {
  if (!leaf) {
    return 'stx { }'
  }

  const start = 'stx ' + (leaf.key ? getString(leaf.key) + ' ' : '')
  const val = leaf.rT ? inspect(branch, branch.leaves[leaf.val]) : leaf.val
  const subLeaves = [...leaf.keys]
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

const serialize = (branch, leaf) => {
  if (!leaf) {
    return {}
  }

  let child = false
  const result = {}
  const val = leaf.rT ? ['@', ...path(branch, leaf.val)] : leaf.val

  leaf.keys.forEach(key => {
    const subLeaf = branch.leaves[key]
    if (subLeaf !== null) {
      child = true
      result[getString(subLeaf.key)] = serialize(branch, subLeaf)
    }
  })
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
