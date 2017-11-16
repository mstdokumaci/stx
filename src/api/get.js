import { root, keyToId, pathToIds } from '../id'
import { set } from './set'

const origin = (branch, leaf) => {
  let origin = leaf
  while (origin && origin.rT) {
    origin = getFromLeaves(branch, origin.rT)
  }
  return origin
}

const getFromLeaves = (branch, id) => {
  const oBranch = branch
  while (branch) {
    if (branch.leaves[id]) {
      const leaf = branch.leaves[id]
      leaf.branch = oBranch
      return leaf
    }
    branch = branch.inherits
  }
}

const getByKey = (branch, key, id = root, val, stamp) => {
  const leafId = keyToId(key, id)
  let leaf = getFromLeaves(branch, leafId)
  if (leaf) {
    return leaf
  } else if (val !== void 0) {
    leaf = getFromLeaves(branch, id)
    set(branch, leaf, id, { [ key ]: val }, stamp)
    return getFromLeaves(branch, leafId)
  }
}

const getByPath = (branch, path, id = root, val, stamp) => {
  const ids = pathToIds(path, id)
  let i = ids.length - 1
  const leafId = ids[i]
  let leaf = getFromLeaves(branch, leafId)
  if (leaf) {
    return leaf
  } else if (val !== void 0) {
    while (i) {
      val = { [ path.splice(i) ]: val }
      i--
      let leaf = getFromLeaves(branch, ids[i])
      if (leaf) {
        set(branch, leaf, ids[i], val, stamp)
        return getFromLeaves(branch, leafId)
      }
    }
  }
}

const getApi = (branch, path, id = root, val, stamp) => {
  if (Array.isArray(path)) {
    const ids = pathToIds(path, id)
    let i = ids.length - 1
    const leafId = ids[i]
    let leaf = getFromLeaves(branch, leafId)
    if (leaf) {
      return leaf
    } else if (val === void 0) {
      while (i) {
        let leaf = getFromLeaves(branch, ids[i])
        if (leaf && (leaf = origin(branch, leaf))) {
          return getApi(branch, path.slice(i + 1), leaf.id, val, stamp)
        }
        i--
      }
    } else {
      while (i) {
        val = { [ path.splice(i) ]: val }
        i--
        let leaf = getFromLeaves(branch, ids[i])
        if (leaf) {
          set(branch, leaf, ids[i], val, stamp)
          leaf = getFromLeaves(branch, leafId)
          return origin(branch, leaf) || leaf
        }
      }
    }
  } else {
    return getByKey(branch, path, id, val, stamp)
  }
}

export { origin, getFromLeaves, getByKey, getByPath, getApi }
