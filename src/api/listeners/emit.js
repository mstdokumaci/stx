import { Leaf } from '../../leaf'
import { fireParentSubscriptions, subscriptions } from '../subscription/fire'
import { drainQueue } from '../client/send'

const emitOwn = (branch, id, event, val, stamp, depth) => {
  const listeners = branch.listeners

  if (listeners[id] && listeners[id][event]) {
    for (const listenerId in listeners[id][event]) {
      listeners[id][event][listenerId](val, stamp, new Leaf(branch, id))
    }
  }

  if (listeners.allData) {
    for (const listenerId in listeners.allData) {
      listeners.allData[listenerId](val, stamp, new Leaf(branch, id))
    }
  }

  if (event === 'data' && val !== 'add-key' && val !== 'remove') {
    subscriptions(branch, id, stamp, depth)
  }
}

const emitBranches = (branches, id, event, val, stamp, depth) =>
  branches.forEach(branch => {
    if (
      branch.leaves[id] === null ||
      (
        event === 'data' &&
        branch.leaves[id] &&
        (
          branch.leaves[id].val !== undefined ||
          branch.leaves[id].rT !== undefined
        )
      )
    ) {
      return
    }

    emitOwn(branch, id, event, val, stamp, depth)

    if (branch.rF[id]) {
      emitReferences(branch, branch.rF[id], event, val, stamp, depth)
    }

    if (branch.branches.length) {
      emitBranches(branch.branches, id, event, val, stamp, depth)
    }
  })

const emitReferences = (branch, ids, event, val, stamp, depth) => {
  ids.forEach(id => {
    emitOwn(branch, id, event, val, stamp, depth)
    if (branch.rF[id]) {
      emitReferences(branch, branch.rF[id], event, val, stamp, depth)
    }
  })
}

const emit = (branch, id, event, val, stamp, depth, isKeys) => {
  emitOwn(branch, id, event, val, stamp, depth)

  if (branch.rF[id]) {
    emitReferences(branch, branch.rF[id], event, val, stamp, depth)
  }

  if (branch.branches.length && !isKeys) {
    emitBranches(branch.branches, id, event, val, stamp, depth)
  }
}

const dataEvents = []
const afterEmitEvents = []

const addDataEvent = (branch, id, val, depth) => {
  dataEvents.push([branch, id, val, depth])
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
      event[3],
      event[2] === 'add-key' || event[2] === 'remove-key'
    )
  )
  fireParentSubscriptions(branch, stamp)
  afterEmitEventsToRun.forEach(event => event())
  if (branch.client.queue) {
    drainQueue(branch.client)
  }
}

export { emit, addDataEvent, emitDataEvents, addAfterEmitEvent }
