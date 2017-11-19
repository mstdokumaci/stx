import { Leaf } from '../index'
import { addToStrings } from '../cache'
import { root, keyToId } from '../id'
import { getFromLeaves, getByPath } from './get'
import { remove, removeReference } from './remove'

const setVal = (branch, leaf, val, stamp) => {
  if (leaf.struct !== branch) {
    branch.leaves[leaf.id] = leaf = new Leaf(
      branch, leaf.id, val, stamp, leaf.p, leaf.key
    )
  } else if (val !== void 0) {
    leaf.val = val
    removeReference(branch, leaf, stamp)
  }
  return leaf
}

const setReferenceByPath = (branch, leaf, path, stamp) =>
  set(branch, leaf, getByPath(branch, root, path, {}, stamp), stamp)

const setReference = (branch, leaf, val, stamp) => {
  const oBranch = branch
  while (branch) {
    if (branch === val.branch) {
      leaf = setVal(oBranch, leaf, void 0, stamp)
      leaf.val = void 0
      leaf.rT = val.id
      const id = branch === oBranch ? leaf.id : [ oBranch, leaf.id ]
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

const setKeys = (branch, leaf, val, stamp, isSubLeaf) => {
  let keys = []
  for (let key in val) {
    if (key === 'val') {
      set(branch, leaf, val.val, stamp)
    } else {
      const subLeafId = keyToId(key, leaf.id)
      const existing = getFromLeaves(branch, subLeafId)
      if (existing) {
        set(branch, existing, val[key], stamp)
        if (isSubLeaf) {
          keys.push(subLeafId)
        }
      } else if (val[key] !== null) {
        const keyId = keyToId(key)
        addToStrings(keyId, key)
        keys.push(subLeafId)
        branch.leaves[subLeafId] = new Leaf(
          branch, subLeafId, val[key], stamp, leaf.id, keyId, true
        )
      }
    }
  }
  if (keys.length) {
    leaf = setVal(branch, leaf, void 0, stamp)
    leaf.keys = leaf.keys ? leaf.keys.concat(keys) : keys
  }
}

const set = (branch, leaf, val, stamp, isSubLeaf) => {
  if (typeof val === 'object') {
    if (!val) {
      remove(branch, leaf, stamp)
    } else if (Array.isArray(val)) {
      if (val[0] === '@') {
        setReferenceByPath(branch, leaf, val.slice(1), stamp)
      } else {
        setVal(branch, leaf, val, stamp)
      }
    } else if (val.isLeaf) {
      setReference(branch, leaf, val, stamp)
    } else {
      setKeys(branch, leaf, val, stamp, isSubLeaf)
    }
  } else {
    setVal(branch, leaf, val, stamp)
  }
}

export { setReferenceByPath, setReference, set, setVal }
