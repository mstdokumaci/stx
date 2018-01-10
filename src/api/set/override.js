import { root } from '../../id'
import { getByPath } from '../get'
import { remove } from '../remove'
import { addDataEvent } from '../listeners/emit'
import { addOwnLeaf, checkReferenceByLeaf, cleanBranchRt, setKeys } from './index'

const setOverrideVal = (branch, leaf, id, val, stamp) => {
  if (val !== leaf.val && val !== void 0) {
    leaf = addOwnLeaf(branch, id, leaf.parent, leaf.key, stamp)
    leaf.val = val

    addDataEvent(void 0, id, 'set')
  }
}

const setOverrideReference = (branch, leaf, id, rT, stamp) => {
  if (leaf.rT === rT) {
    return
  }

  leaf = addOwnLeaf(branch, id, leaf.parent, leaf.key, stamp)

  leaf.rT = rT
  branch.rF[rT] = (branch.rF[rT] || []).concat(id)

  addDataEvent(void 0, id, 'set')

  if (branch.branches.length) {
    cleanBranchRt(branch.branches, id, rT)
  }
}

const setOverride = (branch, leaf, id, val, stamp) => {
  if (typeof val === 'object') {
    if (!val) {
      remove(branch, id, stamp)
    } else if (Array.isArray(val)) {
      if (val[0] === '@') {
        const rT = getByPath(branch, root, val.slice(1), {}, stamp)
        setOverrideReference(branch, leaf, id, rT, stamp)
      } else {
        setOverrideVal(branch, leaf, id, val, stamp)
      }
    } else if (val.isLeaf) {
      checkReferenceByLeaf(branch, id, val.branch, val.id, () => {
        setOverrideReference(branch, leaf, id, val.id, stamp)
      })
    } else {
      setKeys(branch, id, val, stamp)
    }
  } else {
    setOverrideVal(branch, leaf, id, val, stamp)
  }
}

export { setOverride }
