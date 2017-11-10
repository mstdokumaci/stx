import { Leaf } from './index'
import { addToStrings } from './cache'
import { root, keyToId } from './id'
import { getByPath } from './get'

const setReferenceByPath = (target, path, stamp, id, branch) =>
  set(target, getByPath(branch, path, root, {}, stamp), stamp, id, branch)

const setReference = (target, val, stamp, id) => {
  target.rT = val.id
  if (val.rF) {
    val.rF.push(id)
  } else {
    val.rF = [ id ]
  }
}

const setKeys = (target, val, stamp, id, branch) => {
  let keys = []
  for (let key in val) {
    if (key === 'val') {
      setVal(target, val.val, stamp, id, branch)
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
    target.keys = target.keys ? target.keys.concat(keys) : keys
  }
}

const set = (target, val, stamp, id, branch) => {
  if (typeof val === 'object') {
    if (!val) {
      // is null
    } else if (Array.isArray(val)) {
      if (val[0] === '@') {
        setReferenceByPath(target, val.slice(1), stamp, id, branch)
      } else {
        // TODO: handle setting array
      }
    } else if (val.isLeaf) {
      while (branch) {
        if (branch === val.branch) {
          return setReference(target, val, stamp, id)
        }
        branch = branch.inherits
      }
      throw new Error('Reference must be in same branch')
    } else {
      setKeys(target, val, stamp, id, branch)
    }
  } else {
    setVal(target, val, stamp, id, branch)
  }
}

const setVal = (target, val, stamp, id, branch) => {
  target.val = val
}

export { setReferenceByPath, setReference, set, setVal }
