import { getFromLeaves } from './get'
import { emit } from './listeners'

const removeOverrides = (branches, id) => {
  branches.forEach(branch => {
    if (branch.leaves[id] === null) {
      delete branch.leaves[id]
    } else if (!branch.leaves[id]) {
      removeListeners(branch, id)
    }
    if (branch.branches.length) {
      removeOverrides(branch.branches, id)
    }
  })
}

const removeReference = (leaf, stamp) => {
  if (leaf.rT) {
    const rT = getFromLeaves(leaf.branch, leaf.rT)
    if (rT.rF) {
      const rFIndex = leaf.struct === rT.struct ? rT.rF.indexOf(leaf.id)
        : rT.rF.findIndex(from => from[0] === leaf.struct && from[1] === leaf.id)
      rT.rF.splice(rFIndex, 1)
    }
    leaf.rT = void 0
  }
}

const removeListeners = (branch, id) => {
  delete branch.listeners[id]
}

const removeFromParent = (parent, id, stamp) => {
  const index = parent.keys.indexOf(id)
  if (~index) {
    parent.keys.splice(index, 1)
    emit(parent, 'data', 'set', stamp)
  }
}

const removeOwn = (leaf, stamp, ignoreParent) => {
  delete leaf.branch.leaves[leaf.id]

  if (!ignoreParent) {
    removeFromParent(leaf.branch.leaves[leaf.p], leaf.id, stamp)
  }

  if (leaf.branch.branches.length) {
    removeOverrides(leaf.branch.branches, leaf.id)
  }
}

const removeBranch = (branch, id) => {
  branch.leaves[id] = null
}

const removeChildren = (leaf, stamp) => {
  if (leaf.keys) {
    leaf.keys.forEach(keyId =>
      remove(getFromLeaves(leaf.branch, keyId), stamp, true)
    )
  }
}

const remove = (leaf, stamp, ignoreParent) => {
  emit(leaf, 'data', 'remove', stamp)

  if (leaf.struct === leaf.branch) {
    removeOwn(leaf, stamp, ignoreParent)
  } else {
    removeBranch(leaf.branch, leaf.id)
  }

  removeChildren(leaf, stamp)
  removeReference(leaf, stamp)
  removeListeners(leaf.branch, leaf.id)
}

export { remove, removeReference }
