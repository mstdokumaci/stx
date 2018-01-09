import { getFromLeaves } from './get'
import { emit, addDataEvent } from './listeners/emit'
import { addBranchLeaf } from './set'
import { children } from './array'

const removeListenersSubscriptions = (branch, id) => {
  delete branch.listeners[id]
  delete branch.subscriptions[id]
}

const removeReference = (branch, id, rT) => {
  if (rT) {
    branch.rF[rT].splice(branch.rF[rT].indexOf(id), 1)
    if (!branch.rF[rT].length) {
      delete branch.rF[rT]
    }
  }
}

const removeFromBranches = (branches, id, parent, keys, stamp) =>
  branches.forEach(branch => {
    let parentNext = parent
    let keysNext = keys

    if (branch.leaves[id] === null) {
      delete branch.leaves[id]
      return
    } else {
      if (keys) {
        const addKeys = keys.filter(keyId => branch.leaves[keyId])
        if (addKeys.length) {
          const branchLeaf = addBranchLeaf(branch, id, stamp)
          branchLeaf.keys = (branchLeaf.keys || []).concat(addKeys)
          keysNext = keys.filter(keyId => !branch.leaves[keyId])
        }
      }
      if (branch.leaves[id]) {
        if (parent) {
          const parentLeaf = addBranchLeaf(branch, parent, stamp)
          parentLeaf.keys = (parentLeaf.keys || []).concat(id)
          parentNext = void 0
        }
      } else {
        if (parent) {
          addDataEvent(branch, getFromLeaves(branch, parent), 'remove-key')
        }
        removeListenersSubscriptions(branch, id)
      }
    }

    if (branch.branches.length) {
      removeFromBranches(branch.branches, id, parentNext, keysNext, stamp)
    }
  })

const removeFromParent = (branch, parent, id) => {
  if (branch.leaves[parent]) {
    const index = branch.leaves[parent].keys.indexOf(id)
    if (~index) {
      branch.leaves[parent].keys.splice(index, 1)
      addDataEvent(void 0, parent, 'remove-key')
      return parent
    }
  }
}

const removeOwn = (branch, id, stamp, ignoreParent) => {
  const parent = ignoreParent ? void 0
    : removeFromParent(branch, branch.leaves[id].parent, id, stamp)

  if (branch.branches.length) {
    removeFromBranches(branch.branches, id, parent, branch.leaves[id].keys, stamp)
  }

  delete branch.leaves[id]
}

const removeInherited = (branch, id, stamp, ignoreParent) => {
  const leaf = getFromLeaves(branch, id)[id]

  if (!ignoreParent) {
    addDataEvent(void 0, leaf.parent, 'remove-key')
  }

  if (branch.branches.length) {
    removeFromBranches(
      branch.branches, id, ignoreParent ? void 0 : leaf.parent, leaf.keys, stamp
    )
  }

  branch.leaves[id] = null
}

const removeChildren = (branch, id, stamp) => {
  children(branch, id, (subBranch, id) =>
    remove(branch, id, stamp, true)
  )
}

const remove = (branch, id, stamp, ignoreParent) => {
  emit(branch, id, 'data', 'remove', stamp)

  if (branch.leaves[id]) {
    removeOwn(branch, id, stamp, ignoreParent)
  } else {
    removeInherited(branch, id, stamp, ignoreParent)
  }

  removeChildren(branch, id, stamp)
  removeReference(branch, id, stamp)
  removeListenersSubscriptions(branch, id)
}

export { remove, removeReference }
