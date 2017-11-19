import { keyToId, pathToIds } from '../id'
import { set } from './set'

const getFromLeaves = (branch, id) => {
  const oBranch = branch
  while (branch) {
    if (branch.leaves[id] === null) {
      return null
    } else if (branch.leaves[id]) {
      const leaf = branch.leaves[id]
      leaf.branch = oBranch
      return leaf
    }
    branch = branch.inherits
  }
}

const origin = (branch, leaf) => getFromLeaves(branch, leaf.rT) || leaf

const getByKey = (branch, id, key, val, stamp, inReference) => {
  const leafId = keyToId(key, id)
  const subLeaf = getFromLeaves(branch, leafId)
  if (subLeaf) {
    return subLeaf
  } else {
    const leaf = getFromLeaves(branch, id)
    if (leaf.rT) {
      const originSubLeaf = getByKey(branch, leaf.rT, key, val, stamp, true)
      if (originSubLeaf) {
        return originSubLeaf
      }
    }

    if (!inReference && val !== void 0) {
      set(branch, leaf, { [ key ]: val }, stamp)
      return branch.leaves[leafId]
    }
  }
}

const setByPath = (branch, ids, path, val, stamp, inReference) => {
  let i = ids.length - 1
  const leafId = ids[i]
  while (i--) {
    if (i === 0 && inReference) {
      return
    }
    val = { [ path.pop() ]: val }
    const leaf = getFromLeaves(branch, ids[i])
    if (leaf) {
      set(branch, leaf, val, stamp)
      return branch.leaves[leafId]
    }
  }
}

const getByPath = (branch, id, path, val, stamp, inReference) => {
  const ids = pathToIds(path, id)
  let i = ids.length - 1
  const subLeaf = getFromLeaves(branch, ids[i])
  if (subLeaf) {
    return subLeaf
  } else {
    while (i--) {
      const leaf = getFromLeaves(branch, ids[i])
      if (leaf && leaf.rT) {
        const originSubLeaf = getByPath(
          branch, leaf.rT, path.slice(i), val, stamp, true
        )
        if (originSubLeaf) {
          return originSubLeaf
        }
      }
    }
    if (val !== void 0) {
      return setByPath(branch, ids, path, val, stamp, inReference)
    }
  }
}

const getApi = (branch, id, path, val, stamp) => {
  if (Array.isArray(path)) {
    return getByPath(branch, id, path, val, stamp)
  } else {
    return getByKey(branch, id, path, val, stamp)
  }
}

export { getFromLeaves, origin, getByKey, getByPath, getApi }
