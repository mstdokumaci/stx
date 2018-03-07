import { Leaf } from '../..'
import { subscriptions } from '../subscription/fire'

const emitOwn = (branch, id, event, val, stamp) => {
  const listeners = branch.listeners

  if (listeners[id] && listeners[id][event]) {
    for (const listenerId in listeners[id][event]) {
      listeners[id][event][listenerId](val, stamp, new Leaf(branch, id))
    }
  }

  if (event === 'data' && val !== 'add-key' && val !== 'remove') {
    subscriptions(branch, id, stamp)
  }
}

const emitBranches = (branches, id, event, val, stamp) =>
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

    emitOwn(branch, id, event, val, stamp)

    if (branch.rF[id]) {
      emitReferences(branch, branch.rF[id], event, val, stamp)
    }

    if (branch.branches.length) {
      emitBranches(branch.branches, id, event, val, stamp)
    }
  })

const emitReferences = (branch, ids, event, val, stamp) => {
  for (const id in ids) {
    emitOwn(branch, id, event, val, stamp)
    emitReferences(branch, ids[id], event, val, stamp)
  }
}

const emit = (branch, id, event, val, stamp, isKeys) => {
  emitOwn(branch, id, event, val, stamp)

  if (branch.rF[id]) {
    emitReferences(branch, branch.rF[id], event, val, stamp)
  }

  if (branch.branches.length && !isKeys) {
    emitBranches(branch.branches, id, event, val, stamp)
  }
}

const dataEvents = []
const afterEmitEvents = []

const addDataEvent = (branch, id, val) => {
  dataEvents.push([ branch, id, val ])
}

const addAfterEmitEvent = (cb) => afterEmitEvents.push(cb)

const emitDataEvents = (branch, stamp) => {
  const afterEmitEventsToRun = afterEmitEvents.splice(0)
  dataEvents.splice(0).forEach(event =>
    emit(
      event[0] || branch,
      event[1],
      'data',
      event[2],
      stamp,
      event[2] === 'add-key' || event[2] === 'remove-key'
    )
  )
  afterEmitEventsToRun.forEach(event => event())
}

export { emit, addDataEvent, emitDataEvents, addAfterEmitEvent }
