import { Leaf } from '../../index'
import { getFromLeaves } from '../get'

const emitBranches = (branches, leaf, event, val, stamp) =>
  branches.forEach(branch => {
    if (
      branch.leaves[leaf.id] === null ||
      (
        (
          event === 'data' &&
          (
            val === 'set' ||
            val === 'remove'
          )
        ) &&
        branch.leaves[leaf.id] &&
        (
          branch.leaves[leaf.id].val !== void 0 ||
          branch.leaves[leaf.id].rT !== void 0
        )
      )
    ) {
      return
    }

    emit(branch, leaf, event, val, stamp)
  })

const emitReferences = (oBranch, leaf, event, val, stamp) => {
  let branch = oBranch
  const id = leaf.id

  while (branch) {
    leaf = branch.leaves[id]
    if (leaf === null) {
      return
    } else if (leaf && leaf.rF) {
      leaf.rF.forEach(from => {
        const referenceLeaf = getFromLeaves(oBranch, from)
        if (referenceLeaf) {
          emit(oBranch, referenceLeaf, event, val, stamp, true)
        }
      })
    }
    branch = branch.inherits
  }
}

const emit = (branch, leaf, event, val, stamp, isRef) => {
  const listeners = branch.listeners

  if (listeners[leaf.id] && listeners[leaf.id][event]) {
    for (const id in listeners[leaf.id][event]) {
      listeners[leaf.id][event][id](val, stamp, new Leaf(branch, leaf))
    }
  }

  emitReferences(branch, leaf, event, val, stamp)

  if (
    branch.branches.length &&
    !isRef &&
    !(
      event === 'data' &&
      (
        val === 'remove-key' ||
        val === 'add-key'
      )
    )
  ) {
    emitBranches(branch.branches, leaf, event, val, stamp)
  }
}

export { emit }
