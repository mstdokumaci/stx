const origin = (branch, id) => {
  return (branch.leaves[id].rT && branch.leaves[branch.leaves[id].rT])
    ? origin(branch, branch.leaves[id].rT) : id
}

const compute = (branch, id) => {
  if (branch.leaves[id]) {
    if (branch.leaves[id].val !== undefined) {
      return branch.leaves[id].val
    } else if (branch.leaves[id].rT) {
      return compute(branch, branch.leaves[id].rT)
    }
  }
}

export { compute, origin }
