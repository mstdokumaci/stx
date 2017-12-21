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
  const listeners = leaf.branch.listeners

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

  if (listeners[leaf.id] && listeners[leaf.id][event]) {
    for (const id in listeners[leaf.id][event]) {
      listeners[leaf.id][event][id](val, stamp, leaf)
    }
  }

  leaf.branch.branches.forEach(branch => {
    leaf.branch = branch
    emitBranches(leaf, event, val, stamp)
  })
}

const emit = (leaf, event, val, stamp, isVal) => {
  const oBranch = leaf.branch

  emitBranches(leaf, event, val, stamp, isVal)

  leaf.branch = oBranch
  return leaf
}

export { listen, unListen, emit }
