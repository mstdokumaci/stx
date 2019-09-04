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
} from './utils'

const setOwnNewVal = (_, leaf, id, val, stamp) => {
  leaf.rT = false
  leaf.val = val
  leaf.stamp = stamp

  addDataEvent(undefined, id, 'set', leaf.depth)
}

const setOwnNewReference = (branch, leaf, id, rT, stamp) => {
  if (branch.branches.length) {
    fixBranchReferences(branch.branches, id, rT)
  }

  leaf.rT = true
  leaf.val = rT
  leaf.stamp = stamp
  addReferenceFrom(branch, id, rT)
  addDataEvent(undefined, id, 'set', leaf.depth)
}

const setOwnNewKeys = (branch, leaf, id, val, stamp) => {
  const keys = new Set()
  for (const key in val) {
    const valKey = val[key]
    if (key === 'val') {
      setOwnNew(branch, leaf, id, val.val, stamp)
    } else if (valKey !== undefined && valKey !== null) {
      const subLeafId = keyToId(key, id)
      const keyId = keyToId(key)
      addToStrings(keyId, key)
      keys.add(subLeafId)
      leaf.keys.add(subLeafId)
      const subLeaf = addOwnLeaf(branch, subLeafId, id, keyId, leaf.depth + 1, stamp)
      setOwnNew(branch, subLeaf, subLeafId, valKey, stamp)
    }
  }
  if (keys.size) {
    leaf.stamp = stamp
    if (branch.branches.length) {
      cleanBranchKeys(branch.branches, id, keys, stamp)
    }
    addDataEvent(undefined, id, 'add-key')
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
      checkReferenceByLeaf(branch, val.branch, val.id, () => {
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
