import { getFromLeaves, getRefFromLeaves } from './get'

const getValOrRef = (branch, id) => {
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

const origin = (branch, leaf) => {
  const originLeaf = getFromLeaves(branch, getRefFromLeaves(branch, leaf.id))
  return originLeaf ? origin(branch, originLeaf) : leaf
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

export { getValOrRef, compute, origin }
