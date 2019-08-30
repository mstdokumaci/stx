import { root } from '../../id'
import { createStamp } from '../../stamp'
import { create, createPersist, Leaf } from '../../leaf'
import {
  setOwnExistingVal,
  setOwnExistingReference
} from '../set/own-existing'
import {
  setOverrideVal,
  setOverrideReference
} from '../set/override'
import { emit, emitDataEvents } from '../listeners/emit'
import { path } from '../serialize'
import {
  syncSubscriptions,
  removeSubscriptionsAndAllDataListener,
  addAllDataListener
} from './subscriptions'
import { cache, reuseCache } from './cache'

const switchBranch = async (socketId, socket, master, branchKey, persist) => {
  let branch = master.branches.find(branch => branch.key === branchKey)

  if (!branch) {
    if (persist) {
      branch = await createPersist(undefined, persist, undefined, master)
      branch = branch.branch
    } else {
      branch = create(undefined, undefined, master).branch
    }
    branch.key = branchKey
  }

  removeSubscriptionsAndAllDataListener(socket.branch, socketId)
  const reuse = reuseCache(socket)
  socket.branch = branch
  addAllDataListener(branch, socketId, socket, master)

  if (reuse) {
    socket.cache = reuse.cache
    socket.cleanLeaves = reuse.remove
  }

  return new Leaf(branch, root)
}

const setLeaves = (branch, socket, leaves) => {
  if (branch.clientCanUpdate) {
    leaves.forEach(leaf => {
      const [id, stamp, val, rT] = leaf

      if (!(id in branch.leaves)) {
        return
      }

      const setPath = path(branch, id)
      const rule = branch.clientCanUpdate.find(
        rule => rule.path.length === setPath.length && rule.path.every(
          (key, i) => key === '*' || key === setPath[i]
        )
      )

      if (
        rule &&
        (
          typeof rule.authorize !== 'function' ||
          rule.authorize(new Leaf(branch, id))
        )
      ) {
        let changed
        if (Object.prototype.hasOwnProperty.call(branch.leaves, id)) {
          leaf = branch.leaves[id]
          cache(socket, false, id, stamp)

          if (val !== null) {
            changed = setOwnExistingVal(branch, leaf, id, val, stamp, 0)
          } else if (rT) {
            changed = setOwnExistingReference(branch, leaf, id, rT, stamp, 0)
          }
        } else {
          cache(socket, true, id, stamp)

          if (val !== null) {
            changed = setOverrideVal(branch, id, val, stamp, 0)
          } else if (rT) {
            changed = setOverrideReference(branch, id, rT, stamp, 0)
          }
        }

        if (changed && typeof rule.after === 'function') {
          rule.after(new Leaf(branch, id))
        }
      }
    })
    emitDataEvents(branch, createStamp(branch.stamp))
  }
}

const fireEmits = (branch, emits) => {
  emits.forEach(([id, event, val, stamp]) => emit(branch, id, event, val, stamp))
}

const processIncoming = async (server, socketId, socket, master, data) => {
  const { b: branchKey, s: subscriptions, l: leaves, e: emits } = data

  if (
    branchKey !== undefined &&
    branchKey !== socket.branch.key &&
    typeof server.switchBranch === 'function'
  ) {
    await server.switchBranch(
      new Leaf(socket.branch, root),
      branchKey,
      switchBranch.bind(null, socketId, socket, master)
    )
  }

  if (subscriptions && subscriptions.length) {
    syncSubscriptions(socket.branch, socketId, socket, subscriptions)
  }

  if (leaves) {
    setLeaves(socket.branch, socket, leaves)
  }

  if (emits && emits.length) {
    fireEmits(socket.branch, emits)
  }

  if (socket.incoming.length) {
    await processIncoming(server, socketId, socket, master, socket.incoming.shift())
  }

  socket.incoming = null
}

const incoming = (server, socketId, socket, master, data) => {
  if (socket.incoming) {
    socket.incoming.push(data)
  } else {
    socket.incoming = []
    processIncoming(server, socketId, socket, master, data)
  }
}

export { incoming }
