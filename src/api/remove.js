import { getFromLeaves } from './get'
import { emit } from './listeners'
import { setVal } from './set'

const removeFromBranches = (branches, leaf, id, parent, keys, rF, stamp) =>
  branches.forEach(branch => {
    if (branch.leaves[id] === null) {
      delete branch.leaves[id]
      return
    } else {
      if (keys) {
        const addKeys = keys.filter(keyId => branch.leaves[keyId])
        if (addKeys.length) {
          if (!branch.leaves[id]) {
            setVal(branch, leaf, void 0, stamp)
          }
          branch.leaves[id].keys = branch.leaves[id].keys
            ? branch.leaves[id].keys.concat(addKeys) : addKeys

          keys = keys.filter(keyId => !branch.leaves[keyId])
        }
      }
      if (branch.leaves[id]) {
        if (parent) {
          const parentLeaf = setVal(branch, getFromLeaves(branch, parent), void 0, stamp)
          if (parentLeaf.keys) {
            parentLeaf.keys.push(id)
          } else {
            parentLeaf.keys = [ id ]
          }
          parent = void 0
        }
        if (rF) {
          branch.leaves[id].rF = branch.leaves[id].rF
            ? branch.leaves[id].rF.concat(rF) : rF
          rF = void 0
        }
      } else {
        removeListeners(branch, id)
        if (parent) {
          emit(branch, getFromLeaves(branch, parent), 'data', 'remove-key', stamp)
        }
      }
    }

    if (branch.branches.length) {
      removeFromBranches(branch.branches, leaf, id, parent, keys, rF, stamp)
    }
  })

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

const removeListeners = (branch, id) => {
  delete branch.listeners[id]
}

const removeFromParent = (branch, parent, id, stamp) => {
  if (parent) {
    const index = parent.keys.indexOf(id)
    if (~index) {
      parent.keys.splice(index, 1)
      emit(branch, parent, 'data', 'remove-key', stamp)
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

const removeBranch = (branch, id) => {
  branch.leaves[id] = null
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
    removeBranch(branch, leaf.id)
  }

  removeChildren(branch, leaf, stamp)
  removeReference(branch, leaf, stamp)
  removeListeners(branch, leaf.id)
}

export { remove, removeReference }
