import { Leaf } from './index'
import { addToStrings } from './cache'
import { root, keyToId } from './id'
import { getByPath } from './get'

const concatToArray = (existing, add) => {
  const combined = new Array(existing.length + add.length)
  const eL = existing.length
  let i = eL
  while (i--) {
    combined[i] = existing[i]
  }
  i = combined.length
  let j = 0
  while (i-- > eL) {
    combined[i] = add[j++]
  }
  return combined
}

const findReference = (target, val, stamp, id, branch) =>
  set(target, getByPath(branch, val.slice(1), root, {}, stamp), stamp, id, branch)

const setReference = (target, val, stamp, id, branch) => {
  target.rT = val.id
  if (val.rF) {
    val.rF.push(id)
  } else {
    val.rF = [ id ]
  }
}

const set = (target, val, stamp, id, branch) => {
  if (typeof val === 'object') {
    if (!val) {
      // is null
    } else if (Array.isArray(val)) {
      if (val[0] === '@') {
        findReference(target, val, stamp, id, branch)
      }
    } else if (val.isLeaf) {
      if (branch === val.branch) {
        setReference(target, val, stamp, id, branch)
      } else {
        throw new Error('Reference must be in same branch')
      }
    } else {
      let keys
      for (let key in val) {
        if (key === 'val') {
          setVal(target, val.val, stamp, id, branch)
        } else {
          const leafId = keyToId(key, id)
          const keyId = keyToId(key)
          addToStrings(keyId, key)
          if (!keys) keys = []
          keys.push(leafId)
          branch.leaves[leafId] = new Leaf(val[key], stamp, leafId, branch, id, keyId)
        }
        // set subStamp and stuff as well
      }
      if (keys) {
        target.keys = target.keys ? concatToArray(target.keys, keys) : keys
      }
    }
  } else {
    setVal(target, val, stamp, id, branch)
  }
}

const setVal = (target, val, stamp, id, branch) => {
  target.val = val
}

export { findReference, setReference, set, setVal }
