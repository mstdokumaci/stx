import { keyToId, pathToIds } from '../id'
import { set } from './set'

const getFromLeaves = (branch, id) => {
  while (branch) {
    if (branch.leaves[id] === null || branch.leaves[id]) {
      return branch.leaves[id]
    }
    branch = branch.inherits
  }
}

const getRtFromLeaves = (branch, id) => {
  while (branch) {
    if (branch.leaves[id] === null || (branch.leaves[id] && branch.leaves[id].val !== void 0)) {
      return null
    } else if (branch.leaves[id] && branch.leaves[id].rT) {
      return branch.leaves[id].rT
    }
    branch = branch.inherits
  }
}

const getByKey = (branch, id, key, val, stamp, inReference) => {
  const leafId = keyToId(key, id)
  const subLeaf = getFromLeaves(branch, leafId)
  if (subLeaf) {
    return subLeaf
  } else {
    const rT = getRtFromLeaves(branch, id)
    if (rT) {
      const originSubLeaf = getByKey(branch, rT, key, val, stamp, true)
      if (originSubLeaf) {
        return originSubLeaf
      }
    }

    if (!inReference && val !== void 0) {
      const leaf = getFromLeaves(branch, id)
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
      const rT = getRtFromLeaves(branch, ids[i])
      if (rT) {
        const originSubLeaf = getByPath(branch, rT, path.slice(i), val, stamp, true)
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

export { getFromLeaves, getRtFromLeaves, getByPath, getApi }
