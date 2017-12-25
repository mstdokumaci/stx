import { getFromLeaves } from './get'
import { emit } from './listeners'
import { setVal } from './set'

const removeFromBranches = (branches, id, parent, rF, stamp) =>
  branches.forEach(branch => {
    if (branch.leaves[id] === null) {
      delete branch.leaves[id]
      parent = void 0
      rF = void 0
    } else if (branch.leaves[id]) {
      if (parent) {
        const parentLeaf = setVal(getFromLeaves(branch, parent), void 0, stamp)
        if (parentLeaf.keys) {
          parentLeaf.keys.push(id)
        } else {
          parentLeaf.keys = [ id ]
        }
        parent = void 0
      }
      if (rF) {
        if (branch.leaves[id].rF) {
          branch.leaves[id].rF.concat(rF)
        } else {
          branch.leaves[id].rF = rF
        }
        rF = void 0
      }
    } else {
      removeListeners(branch, id)
    }

    if (branch.branches.length) {
      removeFromBranches(branch.branches, id, parent, rF, stamp)
    }
  })

const removeReference = (branch, leaf, stamp) => {
  if (leaf.rT) {
    const rT = getFromLeaves(branch, leaf.rT)
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
  if (parent) {
    const index = parent.keys.indexOf(id)
    if (~index) {
      parent.keys.splice(index, 1)
      emit(parent, 'data', 'remove-key', stamp, true)
      return parent.id
    }
  }
}

const removeOwn = (branch, leaf, stamp, ignoreParent) => {
  delete branch.leaves[leaf.id]

  const parent = ignoreParent ? void 0
    : removeFromParent(branch.leaves[leaf.parent], leaf.id, stamp)

  if (branch.branches.length) {
    removeFromBranches(branch.branches, leaf.id, parent, leaf.rF, stamp)
  }
}

const removeBranch = (branch, id) => {
  branch.leaves[id] = null
}

const removeChildren = (branch, leaf, stamp) => {
  if (leaf.keys) {
    leaf.keys.forEach(keyId =>
      remove(getFromLeaves(branch, keyId), stamp, true)
    )
  }
}

const remove = (branch, leaf, stamp, ignoreParent) => {
  emit(leaf, 'data', 'remove', stamp, true)

  if (leaf.struct === branch) {
    removeOwn(branch, leaf, stamp, ignoreParent)
  } else {
    removeBranch(branch, leaf.id)
  }

  removeChildren(branch, leaf, stamp)
  removeReference(branch, leaf, stamp)
  removeListeners(branch, leaf.id)
}

export { remove, removeReference }
