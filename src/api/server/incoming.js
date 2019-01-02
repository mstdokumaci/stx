import { root } from '../../id'
import { createStamp } from '../../stamp'
import { create, Leaf } from '../../leaf'
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

const switchBranch = (socketId, socket, master, branchKey) => {
  let branch = master.branches.find(branch => branch.key === branchKey)

  if (!branch) {
    branch = create(void 0, void 0, master).branch
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

const setLeaves = (branch, socket, master, leaves) => {
  if (branch.clientCanUpdate) {
    leaves.forEach(leaf => {
      const [ id, stamp, val, rT ] = leaf

      if (!branch.leaves[id] && !master.leaves[id]) {
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
        if (branch.leaves[id]) {
          leaf = branch.leaves[id]
          cache(socket, false, id, stamp)

          if (val !== null) {
            changed = setOwnExistingVal(branch, leaf, id, val, stamp, 0)
          } else if (rT) {
            changed = setOwnExistingReference(branch, leaf, id, rT, stamp, 0)
          }
        } else if (master.leaves[id]) {
          leaf = master.leaves[id]
          cache(socket, true, id, stamp)

          if (val !== null) {
            changed = setOverrideVal(branch, leaf, id, val, stamp, 0)
          } else if (rT) {
            changed = setOverrideReference(branch, leaf, id, rT, stamp, 0)
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
  emits.forEach(([ id, event, val, stamp ]) => emit(branch, id, event, val, stamp))
}

const incoming = (server, socketId, socket, master, data) => {
  const { b: branchKey, s: subscriptions, l: leaves, e: emits } = data

  if (
    branchKey !== void 0 &&
    branchKey !== socket.branch.key &&
    typeof server.switchBranch === 'function'
  ) {
    server.switchBranch(
      new Leaf(socket.branch, root),
      branchKey,
      switchBranch.bind(null, socketId, socket, master)
    )
  }

  if (subscriptions && subscriptions.length) {
    syncSubscriptions(socket.branch, socketId, socket, master, subscriptions)
  }

  if (leaves) {
    setLeaves(socket.branch, socket, master, leaves)
  }

  if (emits && emits.length) {
    fireEmits(socket.branch, emits)
  }
}

export { incoming }
