import { Leaf } from '../../index'
import { getFromLeaves } from '../get'

const referenceSubscriptions = (branch, ids, stamp, subs) => {
  for (const id in ids) {
    subscriptions(branch, id, stamp, subs)
    referenceSubscriptions(branch, ids[id], stamp, subs)
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

    if (id !== oId && branch.rF[id]) {
      referenceSubscriptions(branch, branch.rF[id], stamp, subs)
    }

    id = getFromLeaves(branch, id).parent
  }
}

const emitOwn = (branch, id, event, val, stamp, subs, isKeys) => {
  const listeners = branch.listeners

  if (listeners[id] && listeners[id][event]) {
    for (const listenerId in listeners[id][event]) {
      listeners[id][event][listenerId](val, stamp, new Leaf(branch, id))
    }
  }

  if (event === 'data' && !isKeys) {
    subscriptions(branch, id, stamp, subs)
  }
}

const emitBranches = (branches, id, event, val, stamp, subs) =>
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

    emitOwn(branch, id, event, val, stamp, subs)

    if (branch.rF[id]) {
      emitReferences(branch, branch.rF[id], event, val, stamp, subs)
    }

    if (branch.branches.length) {
      emitBranches(branch.branches, id, event, val, stamp, subs)
    }
  })

const emitReferences = (branch, ids, event, val, stamp, subs, isKeys) => {
  for (const id in ids) {
    emitOwn(branch, id, event, val, stamp, subs, isKeys)
    emitReferences(branch, ids[id], event, val, stamp, subs, isKeys)
  }
}

const emit = (branch, id, event, val, stamp, subs = {}, isKeys) => {
  emitOwn(branch, id, event, val, stamp, subs, isKeys)

  if (branch.rF[id]) {
    emitReferences(branch, branch.rF[id], event, val, stamp, subs, isKeys)
  }

  if (branch.branches.length && !isKeys) {
    emitBranches(branch.branches, id, event, val, stamp, subs)
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
      event[2] === 'add-key' || event[2] === 'remove-key'
    )
  )
  afterEmitEventsToRun.forEach(event => event())
}

export { emit, addDataEvent, emitDataEvents, addAfterEmitEvent }
