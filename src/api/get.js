import { keyToId, pathToIds } from '../id'
import { set } from './set'

const getByKey = (branch, id, key, val, stamp, inReference) => {
  const leafId = keyToId(key, id)
  if (branch.leaves[leafId]) {
    return leafId
  } else {
    if (branch.leaves[id].rT) {
      const originId = getByKey(
        branch, branch.leaves[id].val, key, val, stamp, true
      )
      if (originId) {
        return originId
      }
    }

    if (!inReference && val !== undefined) {
      set(branch, id, { [key]: val }, stamp)
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
    // buble hack
    const newVal = { [path.pop()]: val }
    val = newVal
    if (branch.leaves[ids[i]]) {
      set(branch, ids[i], val, stamp)
      return leafId
    }
  }
}

const getByPath = (branch, id, path, val, stamp, inReference) => {
  const ids = pathToIds(path, id)
  let i = ids.length - 1
  if (branch.leaves[ids[i]]) {
    return ids[i]
  } else {
    while (i--) {
      const leaf = branch.leaves[ids[i]]
      if (leaf && leaf.rT) {
        const originId = getByPath(
          branch, leaf.val, path.slice(i), val, stamp, true
        )
        if (originId) {
          return originId
        }
      }
    }
    if (val !== undefined) {
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

export { getByPath, getApi }
