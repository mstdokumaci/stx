import { getString } from './cache'
import { getFromLeaves } from './get'

const origin = (branch, leaf) => {
  let origin = leaf
  while (origin && origin.rT) {
    origin = getFromLeaves(branch, origin.rT)
  }
  return origin
}

const compute = (branch, leaf) => {
  if (leaf) {
    leaf = origin(branch, leaf)
    while (leaf.val === void 0 && branch.inherits) {
      leaf = getFromLeaves(branch.inherits, leaf.id)
    }
    return leaf.val
  }
}

const inspect = (branch, leaf) => {
  let val = leaf.val
  let keys = leaf.keys
  const start = 'Struct ' + (leaf.key ? getString(leaf.key) + ' ' : '')
  const origin = leaf.rT && getFromLeaves(branch, leaf.rT)
  if (origin) {
    val = inspect(branch, origin)
  }
  if (keys) {
    if (keys.length > 10) {
      const len = keys.length
      keys = keys.slice(0, 5).map(keyId => {
        const leaf = getFromLeaves(branch, keyId)
        return getString(leaf.key)
      })
      keys.push('... ' + (len - 5) + ' more items')
    } else {
      keys = keys.map(keyId => {
        const leaf = getFromLeaves(branch, keyId)
        return getString(leaf.key)
      })
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

const serialize = (branch, leaf, fn) => {
  let result = {}
  let val = leaf.val
  const keys = leaf.keys
  const origin = leaf.rT && getFromLeaves(branch, leaf.rT)
  if (origin) {
    const path = origin.path()
    val = [ '@' ]
    let i = path.length
    while (i--) {
      val[i + 1] = path[i]
    }
  }
  if (keys) {
    for (let i = 0, len = keys.length; i < len; i++) {
      const keyId = keys[i]
      const subLeaf = getFromLeaves(branch, keyId)
      let keyResult = serialize(branch, subLeaf, fn)
      if (keyResult !== void 0) { result[getString(subLeaf.key)] = keyResult }
    }
    if (val !== void 0) {
      result.val = val
    }
  } else if (val !== void 0) {
    result = val
  }
  return fn ? fn(branch, result) : result
}

export { origin, compute, inspect, serialize }
