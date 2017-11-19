import { getFromLeaves } from './get'

const removeOverrides = (branches, id) => {
  branches.forEach(branch => {
    if (branch.leaves[id] === null) {
      delete branch.leaves[id]
    }
    if (branch.branches.length) {
      removeOverrides(branch.branches, id)
    }
  })
}

const removeReference = (branch, leaf, stamp) => {
  if (leaf.rT) {
    // TODO: remove rF
    leaf.rT = void 0
  }
}

const removeFromParent = (parent, id, stamp) => {
  const index = parent.keys.indexOf(id)
  if (~index) {
    parent.keys.splice(index, 1)
  }
}

const removeOwn = (branch, leaf, stamp, ignoreParent) => {
  delete branch.leaves[leaf.id]

  if (!ignoreParent) {
    removeFromParent(branch.leaves[leaf.p], leaf.id, stamp)
  }

  if (branch.branches.length) {
    removeOverrides(branch.branches, leaf.id)
  }
}

const removeBranch = (branch, leaf, stamp) => {
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
  if (leaf.struct === branch) {
    removeOwn(branch, leaf, stamp, ignoreParent)
  } else {
    removeBranch(branch, leaf, stamp)
  }

  removeChildren(branch, leaf, stamp)
  removeReference(branch, leaf, stamp)
}

export { remove, removeReference }
