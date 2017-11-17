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

const getByKey = (branch, id = root, key, val, stamp) => {
  const leafId = keyToId(key, id)
  let leaf = getFromLeaves(branch, leafId)
  if (leaf) {
    return leaf
  } else if (val !== void 0) {
    leaf = getFromLeaves(branch, id)
    set(branch, leaf, { [ key ]: val }, stamp)
    return branch.leaves[leafId]
  }
}

const setByPath = (branch, id, path, val, stamp, ids, i) => {
  const leafId = ids[i]
  while (i--) {
    val = { [ path.pop() ]: val }
    let leaf = getFromLeaves(branch, ids[i])
    if (leaf) {
      set(branch, leaf, val, stamp)
      return branch.leaves[leafId]
    }
  }
  val = { [ path.pop() ]: val }
  let leaf = getFromLeaves(branch, id)
  if (leaf) {
    set(branch, leaf, val, stamp)
    return branch.leaves[leafId]
  }
}

const getByPath = (branch, id = root, path, val, stamp) => {
  const ids = pathToIds(path, id)
  let i = ids.length - 1
  let leaf = getFromLeaves(branch, ids[i])
  if (leaf) {
    return leaf
  } else if (val !== void 0) {
    setByPath(branch, id, path, val, stamp, ids, i)
  }
}

const getApi = (branch, id = root, path, val, stamp) => {
  if (Array.isArray(path)) {
    // if (path.length < 2) {
    //   return getByKey(branch, id, path[0], val, stamp)
    // }
    const ids = pathToIds(path, id)
    let i = ids.length - 1
    let leaf = getFromLeaves(branch, ids[i])
    if (leaf) {
      return leaf
    } else {
      while (i--) {
        let leaf = getFromLeaves(branch, ids[i])
        if (leaf && (leaf = origin(branch, leaf))) {
          return getApi(branch, leaf.id, path.slice(i + 1), val, stamp)
        }
      }
      if (val !== void 0) {
        setByPath(branch, id, path, val, stamp, ids, ids.length - 1)
      }
    }
  } else {
    return getByKey(branch, id, path, val, stamp)
  }
}

export { origin, getFromLeaves, getByKey, getByPath, getApi }
