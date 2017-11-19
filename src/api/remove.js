import { getFromLeaves } from './get'

const removeReference = (branch, leaf, stamp) => {
  if (leaf.rT) {
    // TODO: remove rF
    leaf.rT = void 0
  }
}

const removeFromParent = (parent, id, stamp) => {
  parent.keys.splice(
    parent.keys.indexOf(id), 1
  )
}

const removeOwn = (branch, leaf, stamp, ignoreParent) => {
  delete branch.leaves[leaf.id]

  if (!ignoreParent) {
    removeFromParent(branch.leaves[leaf.p], leaf.id, stamp)
  }
}

const removeBranch = (branch, leaf, stamp) => {
  branch.leaves[leaf.id] = null
}

const removeChildren = (branch, leaf, stamp) => {
  if (leaf.keys) {
    leaf.keys.forEach(keyId => {
      const subLeaf = getFromLeaves(branch, keyId)
      remove(branch, subLeaf, stamp, true)
    })
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
