import { getFromLeaves } from './get'
import { emit } from './listeners/index'
import { addBranchLeaf } from './set'

const removeListeners = (branch, id) => {
  delete branch.listeners[id]
}

const removeReference = (branch, leaf) => {
  if (leaf.rT) {
    const rT = leaf.rT
    leaf.rT = void 0
    while (branch) {
      if (branch.leaves[rT] === null) {
        return
      } else if (branch.leaves[rT] && branch.leaves[rT].rF) {
        const index = branch.leaves[rT].rF.indexOf(leaf.id)
        if (~index) {
          branch.leaves[rT].rF.splice(index, 1)
          return
        }
      }
      branch = branch.inherits
    }
  }
}

const removeFromBranches = (branches, leaf, id, parent, keys, rF, stamp) =>
  branches.forEach(branch => {
    let parentNext = parent
    let keysNext = keys
    let rFNext = rF

    if (branch.leaves[id] === null) {
      delete branch.leaves[id]
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
      if (branch.leaves[id]) {
        if (parent) {
          const parentLeaf = addBranchLeaf(branch, getFromLeaves(branch, parent), stamp)
          parentLeaf.keys = (parentLeaf.keys || []).concat(id)
          parentNext = void 0
        }
        if (rF) {
          branch.leaves[id].rF = (branch.leaves[id].rF || []).concat(rF)
          rFNext = void 0
        }
      } else {
        if (parent) {
          emit(branch, getFromLeaves(branch, parent), 'data', 'remove-key', stamp)
        }
        removeListeners(branch, id)
      }
    }

    if (branch.branches.length) {
      removeFromBranches(branch.branches, leaf, id, parentNext, keysNext, rFNext, stamp)
    }
  })

const removeFromParent = (branch, parent, id, stamp) => {
  if (parent) {
    const index = parent.keys.indexOf(id)
    if (~index) {
      emit(branch, parent, 'data', 'remove-key', stamp)
      parent.keys.splice(index, 1)
      return parent.id
    }
  }
}

const removeOwn = (branch, leaf, stamp, ignoreParent) => {
  delete branch.leaves[leaf.id]

  const parent = ignoreParent ? void 0
    : removeFromParent(branch, branch.leaves[leaf.parent], leaf.id, stamp)

  if (branch.branches.length) {
    removeFromBranches(branch.branches, leaf, leaf.id, parent, leaf.keys, leaf.rF, stamp)
  }
}

const removeInherited = (branch, leaf, stamp, ignoreParent) => {
  if (!ignoreParent) {
    const parentLeaf = getFromLeaves(leaf.struct, leaf.parent)
    emit(branch, parentLeaf, 'data', 'remove-key', stamp)
  }

  if (branch.branches.length) {
    removeFromBranches(
      branch.branches, leaf, leaf.id, ignoreParent ? void 0 : leaf.parent, leaf.keys, leaf.rF, stamp
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

  if (leaf.struct === branch) {
    removeOwn(branch, leaf, stamp, ignoreParent)
  } else {
    removeInherited(branch, leaf, stamp, ignoreParent)
  }

  removeChildren(branch, leaf, stamp)
  removeReference(branch, leaf, stamp)
  removeListeners(branch, leaf.id)
}

export { remove, removeReference }
