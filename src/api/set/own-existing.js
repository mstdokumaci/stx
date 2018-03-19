import { root } from '../../id'
import { addDataEvent } from '../listeners/emit'
import {
  addReferenceFrom,
  checkReferenceByLeaf,
  fixBranchReferences,
  setKeys
} from './'
import { getRtFromLeaves, getByPath } from '../get'
import { getValOrRef } from '../compute'
import { remove, removeReferenceFrom } from '../remove'

const setOwnExistingVal = (branch, leaf, id, val, stamp) => {
  const valOrRef = getValOrRef(branch, id)
  if (val === valOrRef) {
    return
  } else if (valOrRef && valOrRef.id) {
    removeReferenceFrom(branch, id, valOrRef.id)
    leaf.rT = void 0
  }

  leaf.val = val
  leaf.stamp = stamp

  addDataEvent(void 0, id, 'set')
}

const setOwnExistingReference = (branch, leaf, id, rT, stamp) => {
  const rTold = getRtFromLeaves(branch, id)
  if (rTold === rT) {
    return
  } else if (rTold) {
    delete branch.rF[rTold][id]
  } else {
    leaf.val = void 0
  }

  leaf.rT = rT
  leaf.stamp = stamp
  addReferenceFrom(branch, id, rT)
  addDataEvent(void 0, id, 'set')

  if (branch.branches.length) {
    fixBranchReferences(branch.branches, id, rT, rTold)
  }
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
        return setOwnExistingVal(branch, leaf, id, val, stamp)
      }
    } else if (val.isLeaf) {
      checkReferenceByLeaf(branch, id, val.branch, val.id, () =>
        setOwnExistingReference(branch, leaf, id, val.id, stamp))
    } else {
      setKeys(branch, id, val, stamp)
    }
  } else {
    setOwnExistingVal(branch, leaf, id, val, stamp)
  }
}

export { setOwnExistingVal, setOwnExistingReference, setOwnExisting }
