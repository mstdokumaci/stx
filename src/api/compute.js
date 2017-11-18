import { getFromLeaves } from './get'

const compute = (branch, leaf) => {
  const oBranch = branch
  while (leaf) {
    if (leaf.val !== void 0) {
      return leaf.val
    } else if (leaf.rT) {
      leaf = getFromLeaves(oBranch, leaf.rT)
      const val = compute(oBranch, leaf)
      if (val !== void 0) {
        return val
      }
    } else {
      branch = branch.inherits
      if (branch) {
        leaf = branch.leaves[leaf.id]
      }
    }
  }
}

export { compute }
