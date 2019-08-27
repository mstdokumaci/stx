import { root } from '../../id'
import { addDataEvent } from '../listeners/emit'
import { getByPath } from '../get'
import { remove, removeReferenceFromBranches } from '../remove'
import { setKeys } from './'
import {
  addReferenceFrom,
  removeReferenceFrom,
  checkReferenceByLeaf,
  fixBranchReferences
} from './utils'

const setOverrideVal = (branch, id, val, stamp) => {
  if (val === branch.leaves[id].val) {
    return
  } else if (branch.leaves[id].rT) {
    removeReferenceFromBranches(branch, id, branch.leaves[id].rT)
    branch.leaves[id].rT = undefined
  }

  branch.leaves[id] = Object.create(branch.leaves[id])
  branch.leaves[id].val = val
  branch.leaves[id].stamp = stamp

  addDataEvent(undefined, id, 'set', branch.leaves[id].depth)
  return true
}

const setOverrideReference = (branch, id, rT, stamp) => {
  const rTold = branch.leaves[id].rT
  if (rT === rTold) {
    return
  } else if (rTold) {
    removeReferenceFrom(branch, id, rTold)
  }

  branch.leaves[id] = Object.create(branch.leaves[id])
  branch.leaves[id].rT = rT
  branch.leaves[id].stamp = stamp
  addReferenceFrom(branch, id, rT)
  addDataEvent(undefined, id, 'set', branch.leaves[id].depth)

  if (branch.branches.length) {
    fixBranchReferences(branch.branches, id, rT, rTold)
  }
  return true
}

const setOverride = (branch, leaf, id, val, stamp) => {
  if (typeof val === 'object') {
    if (!val) {
      remove(branch, id, stamp)
    } else if (Array.isArray(val)) {
      if (val[0] === '@') {
        const rT = getByPath(branch, root, val.slice(1), {}, stamp)
        setOverrideReference(branch, id, rT, stamp)
      } else {
        setOverrideVal(branch, id, val, stamp)
      }
    } else if (val.isLeaf) {
      checkReferenceByLeaf(branch, val.branch, val.id, () =>
        setOverrideReference(branch, id, val.id, stamp))
    } else {
      setKeys(branch, leaf, id, val, stamp, setOverride)
    }
  } else {
    setOverrideVal(branch, id, val, stamp)
  }
}

export {
  setOverrideVal,
  setOverrideReference,
  setOverride
}
