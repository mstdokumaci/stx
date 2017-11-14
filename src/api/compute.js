import { origin } from './get'

const compute = (branch, leaf) => {
  if (leaf) {
    leaf = origin(branch, leaf)
    while (leaf.val === void 0 && branch.inherits) {
      if (branch.inherits.leaves[leaf.id]) {
        leaf = branch.inherits.leaves[leaf.id]
      }
      branch = branch.inherits
    }
    return leaf.val
  }
}

export { compute }
