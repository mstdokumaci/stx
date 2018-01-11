import { root } from '../../id'
import { getByPath } from '../get'
import { remove, removeReference } from '../remove'
import { addDataEvent } from '../listeners/emit'
import { checkReferenceByLeaf, cleanBranchRt, setKeys } from './index'

const setOwnExistingVal = (branch, leaf, id, val, stamp) => {
  removeReference(branch, id, leaf.rT)
  leaf.rT = void 0

  leaf.val = val
  leaf.stamp = stamp

  addDataEvent(void 0, id, 'set')
}

const setOwnExistingReference = (branch, leaf, id, rT, stamp) => {
  removeReference(branch, id, leaf.rT)
  leaf.val = void 0

  leaf.rT = rT
  leaf.stamp = stamp
  branch.rF[rT] = (branch.rF[rT] || []).concat(id)

  addDataEvent(void 0, id, 'set')

  if (branch.branches.length) {
    cleanBranchRt(branch.branches, id, rT)
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
        setOwnExistingVal(branch, leaf, id, val, stamp)
      }
    } else if (val.isLeaf) {
      checkReferenceByLeaf(branch, id, val.branch, val.id, () => {
        setOwnExistingReference(branch, leaf, id, val.id, stamp)
      })
    } else {
      setKeys(branch, id, val, stamp)
    }
  } else {
    setOwnExistingVal(branch, leaf, id, val, stamp)
  }
}

export { setOwnExisting }
