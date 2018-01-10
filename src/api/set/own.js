import { addToStrings } from '../../cache'
import { keyToId, root } from '../../id'
import { getByPath } from '../get'
import { remove, removeReference } from '../remove'
import { addDataEvent } from '../listeners/emit'
import {
  addOwnLeaf,
  checkReferenceByLeaf,
  cleanBranchRt,
  cleanBranchKeys,
  setKeys
} from './index'

const setOwnNewVal = (branch, leaf, id, val, stamp) => {
  leaf.val = val
  leaf.stamp = stamp

  addDataEvent(void 0, id, 'set')
}

const setOwnExistingVal = (branch, leaf, id, val, stamp) => {
  removeReference(branch, id, leaf.rT)
  leaf.rT = void 0

  leaf.val = val
  leaf.stamp = stamp

  addDataEvent(void 0, id, 'set')
}

const setOwnNewReference = (branch, leaf, id, rT, stamp) => {
  leaf.rT = rT
  leaf.stamp = stamp
  branch.rF[rT] = (branch.rF[rT] || []).concat(id)

  addDataEvent(void 0, id, 'set')

  if (branch.branches.length) {
    cleanBranchRt(branch.branches, id, rT)
  }
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

const setOwnExisting = (branch, leaf, id, val, stamp) => {
  if (typeof val === 'object') {
    if (!val) {
      remove(branch, id, stamp)
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

export { setOwnNew, setOwnExisting }
