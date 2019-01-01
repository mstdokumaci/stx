import { root } from '../../id'
import { create, Leaf } from '../../leaf'
import { setOwnExistingVal, setOwnExistingReference } from '../set/own-existing'
import { emit } from '../listeners/emit'
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

const setLeaves = (socket, leaves) => {
  if (socket.branch.clientCanUpdate) {
    leaves.forEach(leaf => {
      const [ id, stamp, val, rT ] = leaf

      if (socket.branch.leaves[id]) {
        leaf = socket.branch.leaves[id]
        const setPath = path(socket.branch, id)
        const rule = socket.branch.clientCanUpdate.find(
          rule => rule.path.length === setPath.length && rule.path.every(
            (key, i) => key === '*' || key === setPath[i]
          )
        )

        if (
          rule &&
          (
            typeof rule.authorize !== 'function' ||
            rule.authorize(new Leaf(socket.branch, id))
          )
        ) {
          cache(socket, false, id, stamp)

          if (val !== null) {
            setOwnExistingVal(socket.branch, leaf, id, val, stamp, 0)
          } else if (rT) {
            setOwnExistingReference(socket.branch, leaf, id, rT, stamp, 0)
          }

          if (typeof rule.after === 'function') {
            rule.after(new Leaf(socket.branch, id))
          }
        }
      }
    })
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
    setLeaves(socket, leaves)
  }

  if (emits && emits.length) {
    fireEmits(socket.branch, emits)
  }
}

export { incoming }
