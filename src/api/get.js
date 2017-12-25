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

const getRefFromLeaves = (branch, id) => {
  while (branch) {
    if (branch.leaves[id] === null || (branch.leaves[id] && branch.leaves[id].val)) {
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
    const rT = getRefFromLeaves(branch, id)
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
      const rT = getRefFromLeaves(branch, ids[i])
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

export { getFromLeaves, getByPath, getApi }
