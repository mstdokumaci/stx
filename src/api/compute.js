import { getFromLeaves } from './get'

const getVal = (branch, id) => {
  const oBranch = branch
  while (branch) {
    let leaf = branch.leaves[id]
    if (leaf) {
      if (leaf.val !== void 0) {
        return leaf.val
      } else if (leaf.rT) {
        return getFromLeaves(oBranch, leaf.rT)
      }
    }
    branch = branch.inherits
  }
}

const compute = (branch, id) => {
  const oBranch = branch
  while (branch) {
    const leaf = branch.leaves[id]
    if (leaf) {
      if (leaf.val !== void 0) {
        return leaf.val
      } else if (leaf.rT) {
        const val = compute(oBranch, leaf.rT)
        if (val !== void 0) {
          return val
        }
      }
    }
    branch = branch.inherits
  }
}

export { getVal, compute }
