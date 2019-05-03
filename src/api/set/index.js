import { addToStrings } from '../../cache'
import { keyToId } from '../../id'
import { getBranchForId, getFromLeaves } from '../get'
import { addDataEvent } from '../listeners/emit'
import { addOwnLeaf, cleanBranchKeys } from './utils'
import { setOwnNew } from './own-new'
import { setOwnExisting } from './own-existing'
import { setOverride } from './override'

const setKeys = (branch, leaf, id, val, stamp, depth, set) => {
  let keys = []
  for (let key in val) {
    if (key === 'val') {
      set(branch, leaf, id, val.val, stamp, depth)
    } else {
      const subLeafId = keyToId(key, id)
      const subLeafBranch = getBranchForId(branch, subLeafId)
      if (subLeafBranch) {
        const fn = subLeafBranch === branch ? setOwnExisting : setOverride
        fn(
          branch,
          subLeafBranch.leaves[subLeafId],
          subLeafId,
          val[key],
          stamp,
          depth + 1
        )
      } else if (val[key] !== null && val[key] !== void 0) {
        const keyId = keyToId(key)
        addToStrings(keyId, key)
        keys.push(subLeafId)
        const subLeaf = addOwnLeaf(branch, subLeafId, id, keyId, stamp)
        setOwnNew(branch, subLeaf, subLeafId, val[key], stamp, depth + 1)
      }
    }
  }
  if (keys.length) {
    if (set === setOverride) {
      leaf = branch.leaves[id] || addOwnLeaf(branch, id, leaf.parent, leaf.key, stamp)
    }
    if (leaf.keys) {
      leaf.keys.push(...keys)
    } else {
      leaf.keys = [...keys]
    }
    leaf.stamp = stamp
    cleanBranchKeys(branch.branches, id, keys, stamp)
    addDataEvent(void 0, id, 'add-key')
  }
}

const set = (branch, id, val, stamp) => {
  if (branch.leaves[id]) {
    setOwnExisting(branch, branch.leaves[id], id, val, stamp)
  } else {
    setOverride(branch, getFromLeaves(branch.inherits, id), id, val, stamp)
  }
}

export {
  setKeys,
  set
}
