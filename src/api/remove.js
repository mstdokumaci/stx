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
    const rT = getFromLeaves(branch, leaf.rT)
    if (rT.rF) {
      const rFIndex = leaf.struct === rT.struct ? rT.rF.indexOf(leaf.id)
        : rT.rF.findIndex(from => from[0] === leaf.struct && from[1] === leaf.id)
      rT.rF.splice(rFIndex, 1)
    }
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
  } else if (branch.branches.length) {
    removeOverrides(branch.branches, leaf.id)
  }
}

const removeBranch = (branch, leaf, stamp) => {
  branch.leaves[leaf.id] = null
}

const removeChildren = (branch, leaf, stamp) => {
  if (leaf.keys) {
    leaf.keys.forEach(keyId =>
      remove(getFromLeaves(branch, keyId), stamp, true)
    )
  }
}

const remove = (leaf, stamp, ignoreParent) => {
  if (leaf.struct === leaf.branch) {
    removeOwn(leaf.branch, leaf, stamp, ignoreParent)
  } else {
    removeBranch(leaf.branch, leaf, stamp)
  }

  removeChildren(leaf.branch, leaf, stamp)
  removeReference(leaf.branch, leaf, stamp)
}

export { remove, removeReference }
