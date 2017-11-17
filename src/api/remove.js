import { Leaf } from '../index'

const removeFromParent = (branch, leaf, id, stamp) => {

}

const remove = (branch, leaf, stamp) => {
  if (leaf.struct === branch) {
    delete branch.leaves[leaf.id]
  } else {
    branch.leaves[leaf.id] = new Leaf(
      branch, leaf.id, void 0, stamp, leaf.p, leaf.key
    )
    branch.leaves[leaf.id].val = null
  }

  if (leaf.keys) {
    leaf.keys.forEach(keyId => {
      if (branch.leaves[keyId]) {
        remove(branch, branch.leaves[keyId], stamp)
      }
    })
  }
}

export { remove }
