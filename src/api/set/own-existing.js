import { root } from '../../id'
import { addDataEvent } from '../listeners/emit'
import { getByPath } from '../get'
import { setKeys } from './'
import {
  addReferenceFrom,
  removeReferenceFrom,
  checkReferenceByLeaf,
  fixBranchReferences
} from './utils'
import { remove, removeReferenceFromBranches } from '../remove'

const setOwnExistingVal = (branch, leaf, id, val, stamp) => {
  if (val === leaf.val) {
    return
  } else if (leaf.rT) {
    removeReferenceFromBranches(branch, id, leaf.rT)
    leaf.rT = undefined
  }

  leaf.val = val
  leaf.stamp = stamp

  addDataEvent(undefined, id, 'set', leaf.depth)
  return true
}

const setOwnExistingReference = (branch, leaf, id, rT, stamp) => {
  const rTold = leaf.rT
  if (rT === rTold) {
    return
  } else if (rTold) {
    removeReferenceFrom(branch, id, rTold)
  } else if (leaf.val) {
    leaf.val = undefined
  }

  leaf.rT = rT
  leaf.stamp = stamp
  addReferenceFrom(branch, id, rT)
  addDataEvent(undefined, id, 'set', leaf.depth)

  if (branch.branches.length) {
    fixBranchReferences(branch.branches, id, rT, rTold)
  }
  return true
}

const setOwnExisting = (branch, leaf, id, val, stamp) => {
  if (typeof val === 'object') {
    if (!val) {
      remove(branch, leaf, id, stamp)
    } else if (Array.isArray(val)) {
      if (val[0] === '@') {
        const rT = getByPath(branch, root, val.slice(1), {}, stamp)
        setOwnExistingReference(branch, leaf, id, rT, stamp)
      } else {
        setOwnExistingVal(branch, leaf, id, val, stamp)
      }
    } else if (val.isLeaf) {
      checkReferenceByLeaf(branch, val.branch, val.id, () =>
        setOwnExistingReference(branch, leaf, id, val.id, stamp))
    } else {
      setKeys(branch, leaf, id, val, stamp, setOwnExisting)
    }
  } else {
    setOwnExistingVal(branch, leaf, id, val, stamp)
  }
}

export { setOwnExistingVal, setOwnExistingReference, setOwnExisting }
