const origin = (branch, id) => {
  return branch.leaves[id].rT ? origin(branch, branch.leaves[id].rT) : id
}

const compute = (branch, leaf) => {
  if (leaf) {
    if (leaf.val !== undefined) {
      return leaf.val
    } else if (leaf.rT) {
      return compute(branch, branch.leaves[leaf.rT])
    }
  }
}

export { compute, origin }
