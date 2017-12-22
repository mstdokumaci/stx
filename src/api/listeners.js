let lastId = 0

const listen = (leaf, event, cb, id) => {
  if (!id) {
    id = lastId++
  }

  const listeners = leaf.branch.listeners

  if (!listeners[leaf.id]) {
    listeners[leaf.id] = { [ event ]: {} }
  } else if (!listeners[leaf.id][event]) {
    listeners[leaf.id][event] = {}
  }

  listeners[leaf.id][event][id] = cb

  return leaf
}

const unListen = (leaf, event, id) => {
  delete leaf.branch.listeners[leaf.id][event][id]
}

const emitBranches = (leaf, event, val, stamp, isVal) => {
  if (
    leaf.branch.leaves[leaf.id] === null ||
    (
      isVal &&
      leaf.branch.leaves[leaf.id] &&
      (
        leaf.branch.leaves[leaf.id].val !== void 0 ||
        leaf.branch.leaves[leaf.id].rT !== void 0
      )
    )
  ) {
    return
  }

  leaf.branch.branches.forEach(branch => {
    leaf.branch = branch
    emitOwn(leaf, event, val, stamp, isVal)
  })
}

const emitReferences = (leaf, event, val, stamp) => {
  if (leaf.rF) {
    leaf.rF.forEach(from => {
      const referenceLeaf = Array.isArray(from) ? from[0].leaves[from[1]]
        : leaf.struct.leaves[from]
      const oBranch = referenceLeaf.branch

      referenceLeaf.branch = leaf.branch
      emitOwn(referenceLeaf, event, val, stamp)
      referenceLeaf.branch = oBranch
    })
  }
}

const emitOwn = (leaf, event, val, stamp, isVal) => {
  const listeners = leaf.branch.listeners

  if (listeners[leaf.id] && listeners[leaf.id][event]) {
    for (const id in listeners[leaf.id][event]) {
      listeners[leaf.id][event][id](val, stamp, leaf)
    }
  }

  emitReferences(leaf, event, val, stamp)
  emitBranches(leaf, event, val, stamp, isVal)
}

const emit = (leaf, event, val, stamp, isVal) => {
  const oBranch = leaf.branch

  emitOwn(leaf, event, val, stamp, isVal)

  leaf.branch = oBranch
  return leaf
}

export { listen, unListen, emit }
