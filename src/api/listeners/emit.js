import { Leaf } from '../../index'

const emitBranches = (branches, leaf, event, val, stamp, inLoop, references) =>
  branches.forEach(branch => {
    if (
      branch.leaves[leaf.id] === null ||
      (
        branch.leaves[leaf.id] &&
        (
          inLoop === 'reference' ||
          (
            event === 'data' &&
            (
              val === 'set' ||
              val === 'remove'
            )
          )
        ) &&
        (
          branch.leaves[leaf.id].val !== void 0 ||
          branch.leaves[leaf.id].rT !== void 0
        )
      ) ||
      (
        (
          event === 'data' &&
          (
            val === 'set' ||
            val === 'remove'
          )
        ) &&
        (references || []).filter(rT => (
          branch.leaves[rT] === null ||
          (
            branch.leaves[rT] &&
            (
              branch.leaves[rT].val !== void 0 ||
              branch.leaves[rT].rT !== void 0
            )
          )
        )).length
      )
    ) {
      return
    }

    emit(branch, leaf, event, val, stamp, 'branch', references)
  })

const emitReferences = (oBranch, leaf, event, val, stamp, inLoop, references = []) => {
  const fired = []
  let branch = oBranch
  while (branch) {
    if (branch.leaves[leaf.id] === null) {
      return
    } else if (branch.rF[leaf.id]) {
      branch.rF[leaf.id].forEach(rF => {
        if (!~fired.indexOf(rF)) {
          fired.push(rF)
          references.push(leaf.id)
          emit(oBranch, branch.leaves[rF], event, val, stamp, 'reference', references)
        }
      })
    }

    if (inLoop === 'branch') {
      return
    }

    branch = branch.inherits
  }
}

const emit = (branch, leaf, event, val, stamp, inLoop, references) => {
  const listeners = branch.listeners

  if (listeners[leaf.id] && listeners[leaf.id][event]) {
    for (const id in listeners[leaf.id][event]) {
      listeners[leaf.id][event][id](val, stamp, new Leaf(branch, leaf))
    }
  }

  emitReferences(branch, leaf, event, val, stamp, inLoop, references)

  if (
    branch.branches.length &&
    !(
      event === 'data' &&
      (
        val === 'remove-key' ||
        val === 'add-key'
      )
    )
  ) {
    emitBranches(branch.branches, leaf, event, val, stamp, inLoop, references)
  }
}

export { emit }
