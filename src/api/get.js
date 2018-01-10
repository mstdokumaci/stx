import { keyToId, pathToIds } from '../id'
import { setKeys } from './set/index'

const getFromLeaves = (branch, id) => {
  while (branch) {
    if (branch.leaves[id] === null) {
      return
    } else if (branch.leaves[id]) {
      return branch
    }
    branch = branch.inherits
  }
}

const getRtFromLeaves = (branch, id) => {
  while (branch) {
    if (branch.leaves[id] === null) {
      return
    } else if (branch.leaves[id]) {
      if (branch.leaves[id].rT) {
        return branch.leaves[id].rT
      } else if (branch.leaves[id].val !== void 0) {
        return
      }
    }
    branch = branch.inherits
  }
}

const getByKey = (branch, id, key, val, stamp, inReference) => {
  const leafId = keyToId(key, id)
  if (getFromLeaves(branch, leafId)) {
    return leafId
  } else {
    const rT = getRtFromLeaves(branch, id)
    if (rT) {
      const originId = getByKey(branch, rT, key, val, stamp, true)
      if (originId) {
        return originId
      }
    }

    if (!inReference && val !== void 0) {
      setKeys(branch, id, { [ key ]: val }, stamp)
      return leafId
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
    if (getFromLeaves(branch, ids[i])) {
      setKeys(branch, ids[i], val, stamp)
      return leafId
    }
  }
}

const getByPath = (branch, id, path, val, stamp, inReference) => {
  const ids = pathToIds(path, id)
  let i = ids.length - 1
  if (getFromLeaves(branch, ids[i])) {
    return ids[i]
  } else {
    while (i--) {
      const rT = getRtFromLeaves(branch, ids[i])
      if (rT) {
        const originId = getByPath(branch, rT, path.slice(i), val, stamp, true)
        if (originId) {
          return originId
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
