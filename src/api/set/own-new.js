import { addToStrings } from '../../cache'
import { keyToId, root } from '../../id'
import { getByPath } from '../get'
import { addDataEvent } from '../listeners/emit'
import {
  addOwnLeaf,
  addReferenceFrom,
  checkReferenceByLeaf,
  fixBranchReferences,
  cleanBranchKeys
} from './'

const setOwnNewVal = (branch, leaf, id, val, stamp) => {
  leaf.val = val
  leaf.stamp = stamp

  addDataEvent(void 0, id, 'set')
}

const setOwnNewReference = (branch, leaf, id, rT, stamp) => {
  leaf.rT = rT
  leaf.stamp = stamp
  addReferenceFrom(branch, id, rT)
  addDataEvent(void 0, id, 'set')

  if (branch.branches.length) {
    fixBranchReferences(branch.branches, id, rT)
  }
}

const setOwnNewKeys = (branch, leaf, id, val, stamp) => {
  let keys = []
  for (let key in val) {
    if (key === 'val') {
      setOwnNew(branch, leaf, id, val.val, stamp)
    } else if (val[key] !== null && val[key] !== void 0) {
      const subLeafId = keyToId(key, id)
      const keyId = keyToId(key)
      addToStrings(keyId, key)
      keys.push(subLeafId)
      const subLeaf = addOwnLeaf(branch, subLeafId, id, keyId, stamp)
      setOwnNew(branch, subLeaf, subLeafId, val[key], stamp)
    }
  }
  if (keys.length) {
    leaf.keys = (leaf.keys || []).concat(keys)
    leaf.stamp = stamp
    cleanBranchKeys(branch.branches, id, keys, stamp)
    addDataEvent(void 0, id, 'add-key')
  }
}

const setOwnNew = (branch, leaf, id, val, stamp) => {
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      if (val[0] === '@') {
        const rT = getByPath(branch, root, val.slice(1), {}, stamp)
        setOwnNewReference(branch, leaf, id, rT, stamp)
      } else {
        setOwnNewVal(branch, leaf, id, val, stamp)
      }
    } else if (val.isLeaf) {
      checkReferenceByLeaf(branch, id, val.branch, val.id, () => {
        setOwnNewReference(branch, leaf, id, val.id, stamp)
      })
    } else {
      setOwnNewKeys(branch, leaf, id, val, stamp)
    }
  } else {
    setOwnNewVal(branch, leaf, id, val, stamp)
  }
}

export { setOwnNewVal, setOwnNewReference, setOwnNew }
