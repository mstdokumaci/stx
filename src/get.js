import { root, keyToId, pathToIds } from './id'
import { origin } from './fn'
import { set } from './manipulate'

const getFromLeaves = (branch, id) => {
  const oBranch = branch
  while (branch) {
    if (branch.leaves[id]) {
      const leaf = branch.leaves[id]
      leaf.id = id
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
    set(leaf, { [ key ]: val }, stamp, id, branch)
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
        set(leaf, val, stamp, ids[i], branch)
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
          set(leaf, val, stamp, ids[i], branch)
          leaf = getFromLeaves(branch, leafId)
          return origin(branch, leaf) || leaf
        }
      }
    }
  } else {
    return getByKey(branch, path, id, val, stamp)
  }
}

export { getFromLeaves, getByKey, getByPath, getApi }
