import { Leaf } from '../index'
import { addToStrings } from '../cache'
import { root, keyToId } from '../id'
import { getFromLeaves, getByPath } from './get'

const setVal = (branch, leaf, id, val, stamp) => {
  if (leaf.struct !== branch) {
    branch.leaves[id] = leaf = new Leaf(branch, id, val, stamp, leaf.p, leaf.key)
  } else if (val !== void 0) {
    leaf.val = val
  }
  return leaf
}

const setReferenceByPath = (branch, leaf, id, path, stamp) =>
  set(branch, leaf, id, getByPath(branch, path, root, {}, stamp), stamp)

const setReference = (branch, leaf, id, val, stamp) => {
  const oBranch = branch
  while (branch) {
    if (branch === val.branch) {
      leaf = setVal(oBranch, leaf, id, void 0, stamp)
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

const setKeys = (branch, leaf, id, val, stamp) => {
  let keys = []
  for (let key in val) {
    if (key === 'val') {
      setVal(branch, leaf, id, val.val, stamp)
    } else {
      const leafId = keyToId(key, id)
      const existing = getFromLeaves(branch, leafId)
      if (existing) {
        set(branch, existing, leafId, val[key], stamp)
      } else {
        const keyId = keyToId(key)
        addToStrings(keyId, key)
        keys.push(leafId)
        branch.leaves[leafId] = new Leaf(branch, leafId, val[key], stamp, id, keyId)
      }
    }
  }
  if (keys.length) {
    leaf = setVal(branch, leaf, id, void 0, stamp)
    leaf.keys = leaf.keys ? leaf.keys.concat(keys) : keys
  }
}

const set = (branch, leaf, id, val, stamp) => {
  if (typeof val === 'object') {
    if (!val) {
      // TODO: handle removal
    } else if (Array.isArray(val)) {
      if (val[0] === '@') {
        setReferenceByPath(branch, leaf, id, val.slice(1), stamp)
      } else {
        setVal(branch, leaf, id, val, stamp)
      }
    } else if (val.isLeaf) {
      setReference(branch, leaf, id, val, stamp)
    } else {
      setKeys(branch, leaf, id, val, stamp)
    }
  } else {
    setVal(branch, leaf, id, val, stamp)
  }
}

export { setReferenceByPath, setReference, set, setVal }
