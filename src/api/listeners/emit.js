import { Leaf } from '../../index'
import { getFromLeaves } from '../get'

const emitReferenceSubscriptions = (oBranch, id, stamp, subs) => {
  let branch = oBranch
  while (branch) {
    if (branch.leaves[id] === null) {
      return
    } else if (branch.rF[id]) {
      branch.rF[id].forEach(rF => {
        if (
          branch === oBranch ||
          !(
            oBranch.leaves[rF] === null ||
            (
              oBranch.leaves[rF] &&
              (
                oBranch.leaves[rF].val !== void 0 ||
                oBranch.leaves[rF].rT !== void 0
              )
            )
          )
        ) {
          subscriptions(oBranch, rF, stamp, subs)
          emitReferenceSubscriptions(oBranch, rF, stamp, subs)
        }
      })
    }

    branch = branch.inherits
  }
}

const subscriptions = (branch, id, stamp, subs) => {
  const oId = id
  while (id) {
    if (subs[id]) {
      if (branch.leaves[id] || ~subs[id].indexOf(branch)) {
        return
      } else {
        subs[id].push(branch)
      }
    } else {
      subs[id] = branch.leaves[id] ? [] : [ branch ]
    }

    if (branch.subscriptions[id]) {
      for (const listenerId in branch.subscriptions[id]) {
        branch.subscriptions[id][listenerId](new Leaf(branch, id))
      }
    }

    if (id !== oId) {
      emitReferenceSubscriptions(branch, id, stamp, subs)
    }

    const leaf = getFromLeaves(branch, id).leaves[id]
    if (leaf.parent) {
      id = leaf.parent
    } else {
      return
    }
  }
}

const emitOwn = (branch, id, event, val, stamp, subs, isVal) => {
  const listeners = branch.listeners

  if (listeners[id] && listeners[id][event]) {
    for (const listenerId in listeners[id][event]) {
      listeners[id][event][listenerId](val, stamp, new Leaf(branch, id))
    }
  }

  if (event === 'data' && isVal) {
    subscriptions(branch, id, stamp, subs)
  }
}

const emitReferenceBranches = (branches, id, event, val, stamp, references, subs) =>
  branches.forEach(branch => {
    if (
      branch.leaves[id] === null ||
      (
        branch.leaves[id] &&
        (
          branch.leaves[id].val !== void 0 ||
          branch.leaves[id].rT !== void 0
        )
      ) ||
      (
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

    emitOwn(branch, id, event, val, stamp, subs, true)

    if (branch.rF[id]) {
      emitBranchReferences(branch, id, event, val, stamp, references, subs)
    }

    if (branch.branches.length) {
      emitReferenceBranches(branch.branches, id, event, val, stamp, references, subs)
    }
  })

const emitBranchReferences = (branch, id, event, val, stamp, references, subs) =>
  branch.rF[id].forEach(rF => {
    references.push(id)

    emitOwn(branch, rF, event, val, stamp, subs, true)
    emitOwnReferences(branch, rF, event, val, stamp, references, subs, true)

    if (branch.branches.length) {
      emitReferenceBranches(branch.branches, rF, event, val, stamp, references, subs)
    }
  })

const emitOwnBranches = (branches, id, event, val, stamp, references, subs) =>
  branches.forEach(branch => {
    if (
      branch.leaves[id] === null ||
      (
        event === 'data' &&
        branch.leaves[id] &&
        (
          branch.leaves[id].val !== void 0 ||
          branch.leaves[id].rT !== void 0
        )
      )
    ) {
      return
    }

    emitOwn(branch, id, event, val, stamp, subs, true)

    if (branch.rF[id]) {
      emitBranchReferences(branch, id, event, val, stamp, references, subs)
    }

    if (branch.branches.length) {
      emitOwnBranches(branch.branches, id, event, val, stamp, references, subs)
    }
  })

const emitOwnReferences = (oBranch, id, event, val, stamp, references, subs, isVal) => {
  let branch = oBranch
  while (branch) {
    if (branch.leaves[id] === null) {
      return
    } else if (branch.rF[id]) {
      branch.rF[id].forEach(rF => {
        if (
          branch === oBranch ||
          !(
            oBranch.leaves[rF] === null ||
            (
              oBranch.leaves[rF] &&
              (
                oBranch.leaves[rF].val !== void 0 ||
                oBranch.leaves[rF].rT !== void 0
              )
            )
          )
        ) {
          if (event === 'data') {
            references.push(id)
          }

          emitOwn(oBranch, rF, event, val, stamp, subs, isVal)
          emitOwnReferences(
            oBranch, rF, event, val, stamp, references, subs, isVal
          )

          if (oBranch.branches.length && isVal) {
            emitReferenceBranches(
              oBranch.branches, rF, event, val, stamp, references, subs
            )
          }
        }
      })
    }

    branch = branch.inherits
  }
}

const emit = (branch, id, event, val, stamp, subs = {}, isVal = true) => {
  const references = []
  emitOwn(branch, id, event, val, stamp, subs, isVal)
  emitOwnReferences(branch, id, event, val, stamp, references, subs, isVal)

  if (branch.branches.length && isVal) {
    emitOwnBranches(branch.branches, id, event, val, stamp, references, subs)
  }
}

const dataEvents = []
const afterEmitEvents = []

const addDataEvent = (branch, id, val) => {
  dataEvents.push([ branch, id, val ])
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
