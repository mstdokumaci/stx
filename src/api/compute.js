import { getBranchForId, getRtFromLeaves } from './get'

const getValOrRef = (branch, id) => {
  const oBranch = branch
  while (branch) {
    let leaf = branch.leaves[id]
    if (leaf) {
      if (leaf.val !== void 0) {
        return leaf.val
      } else if (leaf.rT && getBranchForId(oBranch, leaf.rT)) {
        return { id: leaf.rT }
      }
    }
    branch = branch.inherits
  }
}

const origin = (branch, id) => {
  const originId = getRtFromLeaves(branch, id)
  return getBranchForId(branch, originId) ? origin(branch, originId) : id
}

const compute = (branch, id) => {
  const oBranch = branch
  while (branch) {
    const leaf = branch.leaves[id]
    if (leaf) {
      if (leaf.val !== void 0) {
        return leaf.val
      } else if (leaf.rT) {
        return compute(oBranch, leaf.rT)
      }
    }
    branch = branch.inherits
  }
}

export { getValOrRef, compute, origin }
