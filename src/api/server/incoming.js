import { root } from '../../id'
import { create, Leaf } from '../..'
import { emit } from '../listeners/emit'
import {
  syncSubscriptions,
  removeSubscriptionsAndAllDataListener, addAllDataListener
} from './subscriptions'

const switchBranch = (socketId, socket, master, branchKey) => {
  let branch = master.branches.find(branch => branch.key === branchKey)

  if (!branch) {
    branch = create(void 0, void 0, master).branch
    branch.key = branchKey
  }

  removeSubscriptionsAndAllDataListener(socket.branch, socketId)
  addAllDataListener(branch, socketId, socket, master)

  socket.branch = branch

  return new Leaf(branch, root)
}

const fireEmits = (branch, emits) => {
  emits.forEach(([ id, event, val, stamp ]) => emit(branch, id, event, val, stamp))
}

const incoming = (server, socketId, socket, master, data) => {
  const { b: branchKey, s: subscriptions, e: emits } = data

  if (branchKey !== void 0 && branchKey !== socket.branch.key) {
    if (typeof server.switchBranch === 'function') {
      server.switchBranch(
        new Leaf(socket.branch, root),
        branchKey,
        switchBranch.bind(null, socketId, socket, master)
      )
    } else {
      switchBranch(socketId, socket, master, branchKey)
    }
  }

  if (subscriptions && subscriptions.length) {
    syncSubscriptions(socket.branch, socketId, socket, master, subscriptions)
  }

  if (emits && emits.length) {
    fireEmits(socket.branch, emits)
  }
}

export { incoming }
