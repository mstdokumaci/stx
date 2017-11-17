import { Leaf } from '../index'

const removeFromParent = (parent, id, stamp) => {
  parent.keys.splice(
    parent.keys.indexOf(id), 1
  )
}

const removeOwn = (branch, leaf, stamp) => {
  delete branch.leaves[leaf.id]

  removeFromParent(branch.leaves[leaf.p], leaf.id, stamp)
}

const removeBranch = (branch, leaf, stamp) => {
  branch.leaves[leaf.id] = new Leaf(
    branch, leaf.id, void 0, stamp, leaf.p, leaf.key
  )
  branch.leaves[leaf.id].val = null
}

const removeChildren = (branch, leaf, stamp) => {
  if (leaf.keys) {
    leaf.keys.forEach(keyId => {
      if (branch.leaves[keyId]) {
        remove(branch, branch.leaves[keyId], stamp)
      }
    })
  }
}

const remove = (branch, leaf, stamp) => {
  if (leaf.struct === branch) {
    removeOwn(branch, leaf, stamp)
  } else {
    removeBranch(branch, leaf, stamp)
  }

  removeChildren(branch, leaf, stamp)
}

export { remove }
