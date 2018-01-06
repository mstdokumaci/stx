import { Leaf } from '../../index'
import { getFromLeaves } from '../get'

const emitReferenceSubscriptions = (oBranch, leaf, stamp) => {
  const fired = []
  let branch = oBranch
  while (branch) {
    if (branch.leaves[leaf.id] === null) {
      return
    } else if (branch.rF[leaf.id]) {
      branch.rF[leaf.id].forEach(rF => {
        if (
          !(
            ~fired.indexOf(rF) ||
            (
              branch !== oBranch &&
              (
                oBranch.leaves[rF] === null ||
                (
                  oBranch.leaves[rF] &&
                  (
                    oBranch.leaves[rF].val !== void 0 ||
                    oBranch.leaves[rF].rT !== void 0
                  )
                )
              )
            )
          )
        ) {
          fired.push(rF)
          subscriptions(oBranch, branch.leaves[rF], stamp)
          emitReferenceSubscriptions(oBranch, branch.leaves[rF], stamp)
        }
      })
    }

    branch = branch.inherits
  }
}

const subscriptions = (branch, leaf, stamp) => {
  while (leaf) {
    if (leaf.subscriptionStamp === stamp) {
      return
    }

    leaf.subscriptionStamp = stamp

    if (branch.subscriptions[leaf.id]) {
      for (const id in branch.subscriptions[leaf.id]) {
        branch.subscriptions[leaf.id][id](new Leaf(branch, leaf))
      }
    }

    emitReferenceSubscriptions(branch, leaf, stamp)

    if (leaf.parent) {
      leaf = getFromLeaves(branch, leaf.parent)
    } else {
      return
    }
  }
}

const emitOwn = (branch, leaf, event, val, stamp) => {
  const listeners = branch.listeners

  if (listeners[leaf.id] && listeners[leaf.id][event]) {
    for (const id in listeners[leaf.id][event]) {
      listeners[leaf.id][event][id](val, stamp, new Leaf(branch, leaf))
    }
  }

  if (event === 'data') {
    subscriptions(branch, leaf, stamp)
  }
}

const emitReferenceBranches = (branches, leaf, event, val, stamp, references) =>
  branches.forEach(branch => {
    if (
      branch.leaves[leaf.id] === null ||
      (
        branch.leaves[leaf.id] &&
        (
          branch.leaves[leaf.id].val !== void 0 ||
          branch.leaves[leaf.id].rT !== void 0
        )
      ) ||
      (
        event === 'data' &&
        references.filter(rT => (
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

    emitOwn(branch, leaf, event, val, stamp)

    if (branch.rF[leaf.id]) {
      emitBranchReferences(branch, leaf, event, val, stamp, references)
    }

    if (branch.branches.length) {
      emitReferenceBranches(branch.branches, leaf, event, val, stamp, references)
    }
  })

const emitBranchReferences = (branch, leaf, event, val, stamp, references) =>
  branch.rF[leaf.id].forEach(rF => {
    references.push(leaf.id)

    emitOwn(branch, branch.leaves[rF], event, val, stamp)
    emitOwnReferences(branch, branch.leaves[rF], event, val, stamp, references)

    if (branch.branches.length) {
      emitReferenceBranches(branch.branches, branch.leaves[rF], event, val, stamp, references)
    }
  })

const emitOwnBranches = (branches, leaf, event, val, stamp, references) =>
  branches.forEach(branch => {
    if (
      branch.leaves[leaf.id] === null ||
      (
        event === 'data' &&
        branch.leaves[leaf.id] &&
        (
          branch.leaves[leaf.id].val !== void 0 ||
          branch.leaves[leaf.id].rT !== void 0
        )
      )
    ) {
      return
    }

    emitOwn(branch, leaf, event, val, stamp)

    if (branch.rF[leaf.id]) {
      emitBranchReferences(branch, leaf, event, val, stamp, references)
    }

    if (branch.branches.length) {
      emitOwnBranches(branch.branches, leaf, event, val, stamp, references)
    }
  })

const emitOwnReferences = (oBranch, leaf, event, val, stamp, references) => {
  const fired = []
  let branch = oBranch
  while (branch) {
    if (branch.leaves[leaf.id] === null) {
      return
    } else if (branch.rF[leaf.id]) {
      branch.rF[leaf.id].forEach(rF => {
        if (
          !(
            ~fired.indexOf(rF) ||
            (
              branch !== oBranch &&
              (
                oBranch.leaves[rF] === null ||
                (
                  oBranch.leaves[rF] &&
                  (
                    oBranch.leaves[rF].val !== void 0 ||
                    oBranch.leaves[rF].rT !== void 0
                  )
                )
              )
            )
          )
        ) {
          fired.push(rF)
          references.push(leaf.id)

          emitOwn(oBranch, branch.leaves[rF], event, val, stamp)
          emitOwnReferences(oBranch, branch.leaves[rF], event, val, stamp, references)

          if (
            oBranch.branches.length &&
            !(
              event === 'data' &&
              (
                val === 'add-key' ||
                val === 'remove-key'
              )
            )
          ) {
            emitReferenceBranches(oBranch.branches, branch.leaves[rF], event, val, stamp, references)
          }
        }
      })
    }

    branch = branch.inherits
  }
}

const emit = (branch, leaf, event, val, stamp, references = []) => {
  emitOwn(branch, leaf, event, val, stamp)
  emitOwnReferences(branch, leaf, event, val, stamp, references)

  if (
    branch.branches.length &&
    !(
      event === 'data' &&
      (
        val === 'add-key' ||
        val === 'remove-key'
      )
    )
  ) {
    emitOwnBranches(branch.branches, leaf, event, val, stamp, references)
  }
}

const dataEvents = []

const addDataEvent = (branch, leaf, val, stamp) => {
  dataEvents.push([ branch, leaf, 'data', val, stamp])
}

const emitDataEvents = () => {
  let eventsToFire = dataEvents.splice(0)
  eventsToFire.forEach(event => emit(...event))
}

export { emit, addDataEvent, emitDataEvents }
