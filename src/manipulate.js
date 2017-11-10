import { Leaf } from './index'
import { addToStrings } from './cache'
import { root, keyToId } from './id'
import { getByPath } from './get'

const setReferenceByPath = (leaf, path, stamp, id, branch) =>
  set(leaf, getByPath(branch, path, root, {}, stamp), stamp, id, branch)

const setReference = (leaf, val, stamp, id, branch) => {
  const oBranch = branch
  while (branch) {
    if (branch === val.branch) {
      leaf.rT = val.id
      if (branch !== oBranch) {
        id = [oBranch, id]
      }
      if (val.rF) {
        val.rF.push(id)
      } else {
        val.rF = [ id ]
      }
      return
    }
    branch = branch.inherits
  }
  throw new Error('Reference must be in same branch')
}

const setKeys = (leaf, val, stamp, id, branch) => {
  let keys = []
  for (let key in val) {
    if (key === 'val') {
      setVal(leaf, val.val, stamp, id, branch)
    } else {
      const leafId = keyToId(key, id)
      const keyId = keyToId(key)
      addToStrings(keyId, key)
      keys.push(leafId)
      branch.leaves[leafId] = new Leaf(val[key], stamp, leafId, branch, id, keyId)
    }
    // TODO: set subStamp and stuff as well
  }
  if (keys.length) {
    leaf.keys = leaf.keys ? leaf.keys.concat(keys) : keys
  }
}

const setVal = (leaf, val, stamp, id, branch) => {
  leaf.val = val
}

const set = (leaf, val, stamp, id, branch) => {
  if (typeof val === 'object') {
    if (!val) {
      // is null
    } else if (Array.isArray(val)) {
      if (val[0] === '@') {
        setReferenceByPath(leaf, val.slice(1), stamp, id, branch)
      } else {
        // TODO: handle setting array
      }
    } else if (val.isLeaf) {
      setReference(leaf, val, stamp, id, branch)
    } else {
      setKeys(leaf, val, stamp, id, branch)
    }
  } else {
    setVal(leaf, val, stamp, id, branch)
  }
}

export { setReferenceByPath, setReference, set, setVal }
