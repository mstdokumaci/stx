import { addToStrings } from '../../cache'
import { keyToId } from '../../id'
import { getFromLeaves } from '../get'
import { removeReference } from '../remove'
import { addAfterEmitEvent, addDataEvent } from '../listeners/emit'
import { setOwnNew } from './own-new'
import { setOwnExisting } from './own-existing'
import { setOverride } from './override'

const respectOverrides = (branches, id, parent) =>
  branches.forEach(branch => {
    if (branch.leaves[parent] === null) {
      branch.leaves[id] = null
    }
    if (branch.branches.length) {
      respectOverrides(branch.branches, id, parent)
    }
  })

const addOwnLeaf = (branch, id, parent, key, stamp) => {
  branch.leaves[id] = { parent, key, stamp }
  if (branch.branches.length) {
    respectOverrides(branch.branches, id, parent)
  }
  return branch.leaves[id]
}

const addBranchLeaf = (branch, id, stamp) => {
  if (branch.leaves[id]) {
    return branch.leaves[id]
  } else {
    const fromLeaf = getFromLeaves(branch, id).leaves[id]
    return addOwnLeaf(branch, id, fromLeaf.parent, fromLeaf.key, stamp)
  }
}

const cleanBranchRt = (branches, id, rT) =>
  branches.forEach(branch => {
    if (branch.leaves[id] === null) {
      return
    } else if (branch.leaves[id]) {
      if (branch.leaves[id].rT === rT) {
        addAfterEmitEvent(() => {
          removeReference(branch, id, rT)
          branch.leaves[id].rT = void 0
        })
      } else if (branch.leaves[id].rT !== void 0 || branch.leaves[id].val !== void 0) {
        return
      }
    }

    if (branch.branches.length) {
      cleanBranchRt(branch.branches, id, rT)
    }
  })

const checkReferenceByLeaf = (oBranch, id, rTBranch, rT, cb) => {
  let branch = oBranch
  while (branch) {
    if (branch.leaves[rT] === null) {
      throw new Error('Reference must be in same branch')
    } else if (branch === rTBranch) {
      return cb()
    }
    branch = branch.inherits
  }
  throw new Error('Reference must be in same branch')
}

const cleanBranchKeys = (branches, id, keys, stamp) =>
  branches.forEach(branch => {
    let keysNext = keys.slice()

    if (branch.leaves[id] === null) {
      return
    } else if (branch.leaves[id]) {
      if (branch.leaves[id].keys) {
        const firstLength = branch.leaves[id].keys.length
        branch.leaves[id].keys = branch.leaves[id].keys.filter(key => {
          const index = keys.indexOf(key)
          if (~index) {
            keysNext.splice(index, 1)
          } else {
            return true
          }
        })
        if (branch.leaves[id].keys.length === firstLength) {
          addDataEvent(branch, id, 'add-key')
        }
      } else {
        addDataEvent(branch, id, 'add-key')
      }
    } else {
      addDataEvent(branch, id, 'add-key')
    }

    if (branch.branches.length && keysNext.length) {
      cleanBranchKeys(branch.branches, id, keysNext, stamp)
    }
  })

const setKeys = (branch, id, val, stamp) => {
  let keys = []
  for (let key in val) {
    if (key === 'val') {
      set(branch, id, val.val, stamp)
    } else {
      const subLeafId = keyToId(key, id)
      const subLeafBranch = getFromLeaves(branch, subLeafId)
      if (subLeafBranch) {
        if (subLeafBranch === branch) {
          setOwnExisting(
            branch, subLeafBranch.leaves[subLeafId], subLeafId, val[key], stamp
          )
        } else {
          setOverride(
            branch, subLeafBranch.leaves[subLeafId], subLeafId, val[key], stamp
          )
        }
      } else if (val[key] !== null && val[key] !== void 0) {
        const keyId = keyToId(key)
        addToStrings(keyId, key)
        keys.push(subLeafId)
        const subLeaf = addOwnLeaf(branch, subLeafId, id, keyId, stamp)
        setOwnNew(branch, subLeaf, subLeafId, val[key], stamp)
      }
    }
  }
  if (keys.length) {
    const leaf = addBranchLeaf(branch, id, stamp)
    leaf.keys = (leaf.keys || []).concat(keys)
    leaf.stamp = stamp
    cleanBranchKeys(branch.branches, id, keys, stamp)
    addDataEvent(void 0, id, 'add-key')
  }
}

const set = (branch, id, val, stamp) => {
  if (branch.leaves[id]) {
    setOwnExisting(branch, branch.leaves[id], id, val, stamp)
  } else {
    const leafBranch = getFromLeaves(branch.inherits, id)
    setOverride(branch, leafBranch.leaves[id], id, val, stamp)
  }
}

export {
  addOwnLeaf,
  addBranchLeaf,
  checkReferenceByLeaf,
  cleanBranchRt,
  cleanBranchKeys,
  setKeys,
  set
}
