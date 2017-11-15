import { Leaf } from '../index'
import { addToStrings } from '../cache'
import { root, keyToId } from '../id'
import { getFromLeaves, getByPath } from './get'

const setVal = (leaf, val, stamp, id, branch) => {
  if (leaf.kBranch !== branch) {
    branch.leaves[id] = leaf = new Leaf(val, stamp, id, branch, leaf.p, leaf.key)
  } else if (val !== void 0) {
    leaf.val = val
  }
  return leaf
}

const setReferenceByPath = (leaf, path, stamp, id, branch) =>
  set(leaf, getByPath(branch, path, root, {}, stamp), stamp, id, branch)

const setReference = (leaf, val, stamp, id, branch) => {
  const oBranch = branch
  while (branch) {
    if (branch === val.branch) {
      leaf = setVal(leaf, void 0, stamp, id, branch)
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
      const existing = getFromLeaves(branch, leafId)
      if (existing) {
        set(existing, val[key], stamp, leafId, branch)
      } else {
        const keyId = keyToId(key)
        addToStrings(keyId, key)
        keys.push(leafId)
        branch.leaves[leafId] = new Leaf(val[key], stamp, leafId, branch, id, keyId)
      }
    }
  }
  if (keys.length) {
    leaf = setVal(leaf, void 0, stamp, id, branch)
    leaf.keys = leaf.keys ? leaf.keys.concat(keys) : keys
  }
}

const set = (leaf, val, stamp, id, branch) => {
  if (typeof val === 'object') {
    if (!val) {
      // TODO: handle removal
    } else if (Array.isArray(val)) {
      if (val[0] === '@') {
        setReferenceByPath(leaf, val.slice(1), stamp, id, branch)
      } else {
        setVal(leaf, val, stamp, id, branch)
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
