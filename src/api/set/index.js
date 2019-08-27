import { addToStrings } from '../../cache'
import { keyToId } from '../../id'
import { addDataEvent } from '../listeners/emit'
import { addOwnLeaf, cleanBranchKeys } from './utils'
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
        const fn = branch.inherits && branch.leaves[subLeafId] === branch.inherits.leaves[subLeafId] ? setOverride : setOwnExisting
        fn(
          branch, branch.leaves[subLeafId], subLeafId, val[key], stamp
        )
      } else if (val[key] !== undefined && val[key] !== null) {
        const keyId = keyToId(key)
        addToStrings(keyId, key)
        keys.push(subLeafId)
        const subLeaf = addOwnLeaf(
          branch, subLeafId, id, keyId, leaf.depth + 1, stamp
        )
        setOwnNew(branch, subLeaf, subLeafId, val[key], stamp)
      }
    }
  }
  if (keys.length) {
    if (set === setOverride) {
      if (branch.inherits && branch.leaves[id] === branch.inherits.leaves[id]) {
        branch.leaves[id] = Object.create(branch.inherits.leaves[id])
        branch.leaves[id].keys = Object.create(branch.inherits.leaves[id].keys)
      }
    }
    keys.forEach(key => { branch.leaves[id].keys[key] = true })
    branch.leaves[id].stamp = stamp
    cleanBranchKeys(branch.branches, id, keys, stamp)
    addDataEvent(undefined, id, 'add-key')
  }
}

const set = (branch, id, val, stamp) => {
  if (branch.inherits && branch.leaves[id] === branch.inherits.leaves[id]) {
    setOverride(branch, branch.leaves[id], id, val, stamp)
  } else {
    setOwnExisting(branch, branch.leaves[id], id, val, stamp)
  }
}

export {
  setKeys,
  set
}
