import { addToStrings } from '../../cache'
import { keyToId } from '../../id'
import { addDataEvent } from '../listeners/emit'
import { addOwnLeaf, addOverrideLeaf, cleanBranchKeys } from './utils'
import { setOwnNew } from './own-new'
import { setOwnExisting } from './own-existing'
import { setOverride } from './override'

const setKeys = (branch, leaf, id, val, stamp, set) => {
  const keys = []
  for (const key in val) {
    if (key === 'val') {
      set(branch, leaf, id, val.val, stamp)
    } else {
      const subLeafId = keyToId(key, id)
      if (branch.leaves[subLeafId]) {
        const fn = Object.prototype.hasOwnProperty.call(branch.leaves, subLeafId) ? setOwnExisting : setOverride
        fn(
          branch, branch.leaves[subLeafId], subLeafId, val[key], stamp
        )
      } else if (val[key] !== undefined && val[key] !== null) {
        const keyId = keyToId(key)
        addToStrings(keyId, key)
        keys.push(String(subLeafId))
        const subLeaf = addOwnLeaf(
          branch, subLeafId, id, keyId, leaf.depth + 1, stamp
        )
        setOwnNew(branch, subLeaf, subLeafId, val[key], stamp)
      }
    }
  }
  if (keys.length) {
    if (set === setOverride) {
      if (!Object.prototype.hasOwnProperty.call(branch.leaves, id)) {
        leaf = addOverrideLeaf(branch, id, true)
      } else if (!Object.prototype.hasOwnProperty.call(branch.leaves[id], 'keys')) {
        leaf = addOverrideLeaf(branch, id, true, false)
      }
    }
    keys.forEach(key => { leaf.keys[key] = true })
    leaf.stamp = stamp
    if (branch.branches.length) {
      cleanBranchKeys(branch.branches, id, keys, stamp)
    }
    addDataEvent(undefined, id, 'add-key')
  }
}

const set = (branch, id, val, stamp) => {
  if (Object.prototype.hasOwnProperty.call(branch.leaves, id)) {
    setOwnExisting(branch, branch.leaves[id], id, val, stamp)
  } else {
    setOverride(branch, branch.leaves[id], id, val, stamp)
  }
}

export {
  setKeys,
  set
}
