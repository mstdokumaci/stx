import { root } from '../../id'
import { addDataEvent } from '../listeners/emit'
import { getRtFromLeaves, getByPath } from '../get'
import { getValOrRef } from '../compute'
import { remove, removeReferenceFromBranches } from '../remove'
import { setKeys } from './'
import {
  addOwnLeaf,
  addReferenceFrom,
  removeReferenceFrom,
  checkReferenceByLeaf,
  fixBranchReferences
} from './utils'

const setOverrideVal = (branch, leaf, id, val, stamp) => {
  const valOrRef = getValOrRef(branch, id)
  if (val === valOrRef) {
    return
  } else if (valOrRef && valOrRef.id) {
    removeReferenceFromBranches(branch, id, valOrRef.id)
    leaf.rT = void 0
  }

  leaf = addOwnLeaf(branch, id, leaf.parent, leaf.key, leaf.depth, stamp)
  leaf.val = val

  addDataEvent(void 0, id, 'set', leaf.depth)
  return true
}

const setOverrideReference = (branch, leaf, id, rT, stamp) => {
  const rTold = getRtFromLeaves(branch, id)
  if (rTold === rT) {
    return
  } else if (rTold) {
    removeReferenceFrom(branch, id, rTold)
  }

  leaf = addOwnLeaf(branch, id, leaf.parent, leaf.key, leaf.depth, stamp)

  leaf.rT = rT
  addReferenceFrom(branch, id, rT)
  addDataEvent(void 0, id, 'set', leaf.depth)

  if (branch.branches.length) {
    fixBranchReferences(branch.branches, id, rT, rTold)
  }
  return true
}

const setOverride = (branch, leaf, id, val, stamp) => {
  if (typeof val === 'object') {
    if (!val) {
      remove(branch, leaf, id, stamp)
    } else if (Array.isArray(val)) {
      if (val[0] === '@') {
        const rT = getByPath(branch, root, val.slice(1), {}, stamp)
        setOverrideReference(branch, leaf, id, rT, stamp)
      } else {
        setOverrideVal(branch, leaf, id, val, stamp)
      }
    } else if (val.isLeaf) {
      checkReferenceByLeaf(branch, val.branch, val.id, () =>
        setOverrideReference(branch, leaf, id, val.id, stamp))
    } else {
      setKeys(branch, leaf, id, val, stamp, setOverride)
    }
  } else {
    setOverrideVal(branch, leaf, id, val, stamp)
  }
}

export {
  setOverrideVal,
  setOverrideReference,
  setOverride
}
