import { Leaf } from '../index'
import { addToStrings } from '../cache'
import { root, keyToId } from '../id'
import { getFromLeaves, getByPath } from './get'
import { remove, removeReference } from './remove'
import { emit } from './listeners'

const setVal = (leaf, val, stamp) => {
  if (val === leaf.val && val !== void 0) {
    return leaf
  }
  if (leaf.struct !== leaf.branch) {
    leaf.branch.leaves[leaf.id] = leaf = new Leaf(
      leaf.branch, leaf.id, leaf.p, leaf.key
    )
    if (val !== void 0) {
      set(leaf, val, stamp)
    }
  } else if (val !== void 0) {
    leaf.val = val
    removeReference(leaf, stamp)
    emit(leaf, 'data', 'set', stamp, true)
  }
  return leaf
}

const setReferenceByPath = (leaf, path, stamp) =>
  setReference(leaf, getByPath(leaf.branch, root, path, {}, stamp), stamp)

const setReference = (leaf, val, stamp) => {
  leaf = setVal(leaf, void 0, stamp)
  leaf.val = void 0
  leaf.rT = val.id
  const id = val.struct === leaf.branch ? leaf.id
    : [ leaf.branch, leaf.id ]
  if (val.rF) {
    val.rF.push(id)
  } else {
    val.rF = [ id ]
  }
  emit(leaf, 'data', 'set', stamp, true)
}

const setReferenceByLeaf = (leaf, val, stamp) => {
  let branch = leaf.branch
  while (branch) {
    if (branch.leaves[val.id] === null) {
      throw new Error('Reference must be in same branch')
    } else if (branch === val.struct) {
      return setReference(leaf, val, stamp)
    }
    branch = branch.inherits
  }
  throw new Error('Reference must be in same branch')
}

const setKeys = (leaf, val, stamp, isSubLeaf) => {
  let keys = []
  for (let key in val) {
    if (key === 'val') {
      set(leaf, val.val, stamp)
    } else {
      const subLeafId = keyToId(key, leaf.id)
      const existing = getFromLeaves(leaf.branch, subLeafId)
      if (existing) {
        set(existing, val[key], stamp)
        if (isSubLeaf) {
          keys.push(subLeafId)
        }
      } else if (val[key] !== null) {
        const keyId = keyToId(key)
        addToStrings(keyId, key)
        keys.push(subLeafId)
        leaf.branch.leaves[subLeafId] = new Leaf(
          leaf.branch, subLeafId, leaf.id, keyId
        )
        set(leaf.branch.leaves[subLeafId], val[key], stamp, true)
      }
    }
  }
  if (keys.length) {
    leaf = setVal(leaf, void 0, stamp)
    leaf.keys = leaf.keys ? leaf.keys.concat(keys) : keys
    emit(leaf, 'data', 'set', stamp)
  }
}

const set = (leaf, val, stamp, isSubLeaf) => {
  if (typeof val === 'object') {
    if (!val) {
      remove(leaf, stamp)
    } else if (Array.isArray(val)) {
      if (val[0] === '@') {
        setReferenceByPath(leaf, val.slice(1), stamp)
      } else {
        setVal(leaf, val, stamp)
      }
    } else if (val.isLeaf) {
      setReferenceByLeaf(leaf, val, stamp)
    } else {
      setKeys(leaf, val, stamp, isSubLeaf)
    }
  } else {
    setVal(leaf, val, stamp)
  }
}

export { set, setVal }
