const origin = (branch, id) => {
  return branch.leaves[id].rT ? origin(branch, branch.leaves[id].val) : id
}

const compute = (branch, leaf) => {
  if (leaf) {
    if (leaf.rT) {
      return compute(branch, branch.leaves[leaf.val])
    } else if (leaf.val !== undefined) {
      return leaf.val
    }
  }
}

export { compute, origin }
