import { getFromLeaves } from './get'

let lastId = 0

const listen = (branch, leaf, event, cb, id) => {
  if (!id) {
    id = lastId++
  }

  const listeners = branch.listeners

  if (!listeners[leaf.id]) {
    listeners[leaf.id] = { [ event ]: {} }
  } else if (!listeners[leaf.id][event]) {
    listeners[leaf.id][event] = {}
  }

  listeners[leaf.id][event][id] = cb
}

const unListen = (branch, leaf, event, id) => {
  if (branch.listeners[leaf.id] && branch.listeners[leaf.id][event] && id) {
    delete branch.listeners[leaf.id][event][id]
  }
}

const emitBranches = (branches, leaf, event, val, stamp, isVal, isRemoveKey) =>
  branches.forEach(branch => {
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

    emit(branch, leaf, event, val, stamp, isVal)
  })

const emitReferences = (oBranch, leaf, event, val, stamp) => {
  let branch = leaf.struct
  const id = leaf.id

  while (branch) {
    leaf = branch.leaves[id]
    if (leaf === null) {
      return
    } else if (leaf && leaf.rF) {
      leaf.rF.forEach(from => {
        const referenceLeaf = getFromLeaves(oBranch, from)
        if (referenceLeaf) {
          emit(oBranch, referenceLeaf, event, val, stamp, void 0, true)
        }
      })
    }
    branch = branch.inherits
  }
}

const emit = (branch, leaf, event, val, stamp, isVal, isRef) => {
  const listeners = branch.listeners

  if (listeners[leaf.id] && listeners[leaf.id][event]) {
    for (const id in listeners[leaf.id][event]) {
      listeners[leaf.id][event][id](val, stamp, new Leaf(branch, leaf))
    }
  }

  emitReferences(branch, leaf, event, val, stamp)

  if (branch.branches.length && !isRef) {
    emitBranches(branch.branches, event, val, stamp, isVal, event === 'data' && val === 'remove-key')
  }
}

export { listen, unListen, emit }
