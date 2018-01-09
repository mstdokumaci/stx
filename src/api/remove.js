import { getFromLeaves } from './get'
import { emit, addDataEvent } from './listeners/emit'
import { addBranchLeaf } from './set'

const removeListenersSubscriptions = (branch, id) => {
  delete branch.listeners[id]
  delete branch.subscriptions[id]
}

const removeReference = (branch, leaf) => {
  if (leaf.rT) {
    branch.rF[leaf.rT].splice(branch.rF[leaf.rT].indexOf(leaf.id), 1)
    if (!branch.rF[leaf.rT].length) {
      delete branch.rF[leaf.rT]
    }
    delete leaf.rT
  }
}

const removeFromBranches = (branches, leaf, parent, keys, stamp) =>
  branches.forEach(branch => {
    let parentNext = parent
    let keysNext = keys

    if (branch.leaves[leaf.id] === null) {
      delete branch.leaves[leaf.id]
      return
    } else {
      if (keys) {
        const addKeys = keys.filter(keyId => branch.leaves[keyId])
        if (addKeys.length) {
          const branchLeaf = addBranchLeaf(branch, leaf, stamp)
          branchLeaf.keys = (branchLeaf.keys || []).concat(addKeys)
          keysNext = keys.filter(keyId => !branch.leaves[keyId])
        }
      }
      if (branch.leaves[leaf.id]) {
        if (parent) {
          const parentLeaf = addBranchLeaf(branch, getFromLeaves(branch, parent), stamp)
          parentLeaf.keys = (parentLeaf.keys || []).concat(leaf.id)
          parentNext = void 0
        }
      } else {
        if (parent) {
          addDataEvent(branch, getFromLeaves(branch, parent), 'remove-key')
        }
        removeListenersSubscriptions(branch, leaf.id)
      }
    }

    if (branch.branches.length) {
      removeFromBranches(branch.branches, leaf, parentNext, keysNext, stamp)
    }
  })

const removeFromParent = (branch, parent, id) => {
  if (parent) {
    const index = parent.keys.indexOf(id)
    if (~index) {
      parent.keys.splice(index, 1)
      addDataEvent(void 0, parent, 'remove-key')
      return parent.id
    }
  }
}

const removeOwn = (branch, leaf, stamp, ignoreParent) => {
  delete branch.leaves[leaf.id]

  const parent = ignoreParent ? void 0
    : removeFromParent(branch, branch.leaves[leaf.parent], leaf.id, stamp)

  if (branch.branches.length) {
    removeFromBranches(branch.branches, leaf, parent, leaf.keys, stamp)
  }
}

const removeInherited = (branch, leaf, stamp, ignoreParent) => {
  if (!ignoreParent) {
    const parentLeaf = getFromLeaves(branch, leaf.parent)
    addDataEvent(void 0, parentLeaf, 'remove-key')
  }

  if (branch.branches.length) {
    removeFromBranches(
      branch.branches, leaf, ignoreParent ? void 0 : leaf.parent, leaf.keys, stamp
    )
  }

  branch.leaves[leaf.id] = null
}

const removeChildren = (branch, leaf, stamp) => {
  if (leaf.keys) {
    leaf.keys.forEach(keyId =>
      remove(branch, getFromLeaves(branch, keyId), stamp, true)
    )
  }
}

const remove = (branch, leaf, stamp, ignoreParent) => {
  emit(branch, leaf, 'data', 'remove', stamp)

  if (branch.leaves[leaf.id] === leaf) {
    removeOwn(branch, leaf, stamp, ignoreParent)
  } else {
    removeInherited(branch, leaf, stamp, ignoreParent)
  }

  removeChildren(branch, leaf, stamp)
  removeReference(branch, leaf, stamp)
  removeListenersSubscriptions(branch, leaf.id)
}

export { remove, removeReference }
