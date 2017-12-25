import { getFromLeaves } from './get'

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
  if (leaf.branch.listeners[leaf.id] && leaf.branch.listeners[leaf.id][event] && id) {
    delete leaf.branch.listeners[leaf.id][event][id]
  }
}

const emitBranches = (leaf, event, val, stamp, isVal, isRemoveKey) =>
  leaf.branch.branches.forEach(branch => {
    if (
      branch.leaves[leaf.id] === null ||
      (
        isVal &&
        branch.leaves[leaf.id] &&
        (
          branch.leaves[leaf.id].val !== void 0 ||
          branch.leaves[leaf.id].rT !== void 0
        )
      ) ||
      (
        isRemoveKey &&
        branch.leaves[leaf.id]
      )
    ) {
      return
    }

    leaf.branch = branch
    emitOwn(leaf, event, val, stamp, isVal)
  })

const emitReferences = (leaf, event, val, stamp) => {
  let branch = leaf.struct
  const oBranch = leaf.branch
  const id = leaf.id

  while (branch) {
    leaf = branch.leaves[id]
    if (leaf === null) {
      return
    } else if (leaf && leaf.rF) {
      leaf.rF.forEach(from => {
        const referenceLeaf = getFromLeaves(oBranch, from)
        if (referenceLeaf) {
          emitOwn(referenceLeaf, event, val, stamp, void 0, true)
        }
      })
    }
    branch = branch.inherits
  }
}

const emitOwn = (leaf, event, val, stamp, isVal, isRef) => {
  const listeners = leaf.branch.listeners

  if (listeners[leaf.id] && listeners[leaf.id][event]) {
    for (const id in listeners[leaf.id][event]) {
      listeners[leaf.id][event][id](val, stamp, leaf)
    }
  }

  emitReferences(leaf, event, val, stamp)
  if (!isRef) {
    emitBranches(leaf, event, val, stamp, isVal, event === 'data' && val === 'remove-key')
  }
}

const emit = (leaf, event, val, stamp, isVal) => {
  const oBranch = leaf.branch

  emitOwn(leaf, event, val, stamp, isVal)

  leaf.branch = oBranch
  return leaf
}

export { listen, unListen, emit }
