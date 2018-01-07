import { Leaf } from '../../index'
import { getFromLeaves } from '../get'

const emitReferenceSubscriptions = (oBranch, leaf, stamp, subs) => {
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
          subscriptions(oBranch, branch.leaves[rF], stamp, subs)
          emitReferenceSubscriptions(oBranch, branch.leaves[rF], stamp, subs)
        }
      })
    }

    branch = branch.inherits
  }
}

const subscriptions = (branch, leaf, stamp, subs) => {
  const parent = leaf.parent
  while (leaf) {
    if (subs[leaf.id]) {
      if (~subs[leaf.id].indexOf(branch)) {
        return
      } else {
        subs[leaf.id].push(branch)
      }
    } else {
      subs[leaf.id] = [ branch ]
    }

    if (branch.subscriptions[leaf.id]) {
      for (const id in branch.subscriptions[leaf.id]) {
        branch.subscriptions[leaf.id][id](new Leaf(branch, leaf))
      }
    }

    if (leaf.parent !== parent) {
      emitReferenceSubscriptions(branch, leaf, stamp, subs)
    }

    if (leaf.parent) {
      leaf = getFromLeaves(branch, leaf.parent)
    } else {
      return
    }
  }
}

const emitOwn = (branch, leaf, event, val, stamp, subs, isVal) => {
  const listeners = branch.listeners

  if (listeners[leaf.id] && listeners[leaf.id][event]) {
    for (const id in listeners[leaf.id][event]) {
      listeners[leaf.id][event][id](val, stamp, new Leaf(branch, leaf))
    }
  }

  if (event === 'data' && isVal) {
    subscriptions(branch, leaf, stamp, subs)
  }
}

const emitReferenceBranches = (branches, leaf, event, val, stamp, references, subs) =>
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
        references.find(rT => (
          branch.leaves[rT] === null ||
          (
            branch.leaves[rT] &&
            (
              branch.leaves[rT].val !== void 0 ||
              branch.leaves[rT].rT !== void 0
            )
          )
        ))
      )
    ) {
      return
    }

    emitOwn(branch, leaf, event, val, stamp, subs, true)

    if (branch.rF[leaf.id]) {
      emitBranchReferences(branch, leaf, event, val, stamp, references, subs)
    }

    if (branch.branches.length) {
      emitReferenceBranches(branch.branches, leaf, event, val, stamp, references, subs)
    }
  })

const emitBranchReferences = (branch, leaf, event, val, stamp, references, subs) =>
  branch.rF[leaf.id].forEach(rF => {
    references.push(leaf.id)

    emitOwn(branch, branch.leaves[rF], event, val, stamp, subs, true)
    emitOwnReferences(
      branch, branch.leaves[rF], event, val, stamp, references, subs, true
    )

    if (branch.branches.length) {
      emitReferenceBranches(
        branch.branches, branch.leaves[rF], event, val, stamp, references, subs
      )
    }
  })

const emitOwnBranches = (branches, leaf, event, val, stamp, references, subs) =>
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

    emitOwn(branch, leaf, event, val, stamp, subs, true)

    if (branch.rF[leaf.id]) {
      emitBranchReferences(branch, leaf, event, val, stamp, references, subs)
    }

    if (branch.branches.length) {
      emitOwnBranches(branch.branches, leaf, event, val, stamp, references, subs)
    }
  })

const emitOwnReferences = (oBranch, leaf, event, val, stamp, references, subs, isVal) => {
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

          emitOwn(oBranch, branch.leaves[rF], event, val, stamp, subs, isVal)
          emitOwnReferences(
            oBranch, branch.leaves[rF], event, val, stamp, references, subs, isVal
          )

          if (oBranch.branches.length && isVal) {
            emitReferenceBranches(
              oBranch.branches, branch.leaves[rF], event, val, stamp, references, subs
            )
          }
        }
      })
    }

    branch = branch.inherits
  }
}

const emit = (branch, leaf, event, val, stamp, subs = {}, isVal = true) => {
  const references = []
  emitOwn(branch, leaf, event, val, stamp, subs, isVal)
  emitOwnReferences(branch, leaf, event, val, stamp, references, subs, isVal)

  if (branch.branches.length && isVal) {
    emitOwnBranches(branch.branches, leaf, event, val, stamp, references, subs)
  }
}

const dataEvents = []
const afterEmitEvents = []

const addDataEvent = (branch, leaf, val) => {
  dataEvents.push([ branch, leaf, val ])
}

const addAfterEmitEvent = (cb) => afterEmitEvents.push(cb)

const emitDataEvents = (branch, stamp) => {
  const subs = {}
  const afterEmitEventsToRun = afterEmitEvents.splice(0)
  dataEvents.splice(0).forEach(event =>
    emit(
      event[0] || branch,
      event[1],
      'data',
      event[2],
      stamp,
      subs,
      event[2] !== 'add-key' && event[2] !== 'remove-key'
    )
  )
  afterEmitEventsToRun.forEach(event => event())
}

export { emit, addDataEvent, emitDataEvents, addAfterEmitEvent }
