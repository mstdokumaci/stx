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

const switchBranch = async (socket, master, branchKey, persist) => {
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

  removeSubscriptionsAndAllDataListener(socket.branch, socket.id)
  const reuse = reuseCache(socket)
  socket.branch = branch
  addAllDataListener(branch, socket, master)

  if (reuse) {
    socket.cache = reuse.cache
    socket.cleanLeaves = reuse.remove
  }

  return new Leaf(branch, root)
}

const setLeaves = (branch, socket, leaves) => {
  if (branch.clientCanUpdate) {
    const afterEvents = []
    leaves.forEach(leaf => {
      const [id, stamp, val, rT] = leaf

      if (!(id in branch.leaves)) {
        return
      }

      const setPath = path(branch, id)
      const rule = branch.clientCanUpdate.find(
        rule => rule.path.length <= setPath.length && rule.path.every(
          (key, i) => key === '*' || key === setPath[i]
        )
      )

      if (
        rule &&
        (
          typeof rule.authorize !== 'function' ||
          rule.authorize(new Leaf(branch, id), val)
        )
      ) {
        let changed
        const leaf = branch.leaves[id]
        if (Object.prototype.hasOwnProperty.call(branch.leaves, id)) {
          cache(socket, false, id, stamp)

          if (rT) {
            changed = setOwnExistingReference(branch, leaf, id, val, stamp, 0)
          } else if (val !== null) {
            changed = setOwnExistingVal(branch, leaf, id, val, stamp, 0)
          }
        } else {
          cache(socket, true, id, stamp)

          if (rT) {
            changed = setOverrideReference(branch, leaf, id, val, stamp, 0)
          } else if (val !== null) {
            changed = setOverrideVal(branch, leaf, id, val, stamp, 0)
          }
        }

        if (changed && typeof rule.after === 'function') {
          afterEvents.push(rule.after.bind(null, new Leaf(branch, id)))
        }
      }
    })
    emitDataEvents(branch, createStamp(branch.stamp))
    afterEvents.forEach(event => event())
  }
}

const fireEmits = (branch, emits) => {
  emits.forEach(([id, event, val, stamp]) => emit(branch, id, event, val, stamp))
}

const processIncoming = async (server, socket, master, data) => {
  const { b: branchKey, s: subscriptions, l: leaves, e: emits } = data

  if (
    branchKey !== undefined &&
    branchKey !== socket.branch.key &&
    typeof server.switchBranch === 'function'
  ) {
    await server.switchBranch(
      new Leaf(socket.branch, root),
      branchKey,
      switchBranch.bind(null, socket, master)
    )
  }

  if (subscriptions && subscriptions.length) {
    syncSubscriptions(socket.branch, socket, subscriptions)
  }

  if (leaves) {
    setLeaves(socket.branch, socket, leaves)
  }

  if (emits && emits.length) {
    fireEmits(socket.branch, emits)
  }

  if (socket.incoming.length) {
    await processIncoming(server, socket, master, socket.incoming.shift())
  }

  socket.incoming = null
}

const incoming = (server, socket, master, data) => {
  if (socket.incoming) {
    socket.incoming.push(data)
  } else {
    socket.incoming = []
    processIncoming(server, socket, master, data)
  }
}

export { incoming }
