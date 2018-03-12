import { create } from '../..'
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
}

const fireEmits = (branch, emits) => {
  emits.forEach(([ id, event, val, stamp ]) => emit(branch, id, event, val, stamp))
}

const incoming = (server, socketId, socket, master, data) => {
  const { b: branchKey, s: subscriptions, e: emits } = data

  if (branchKey !== void 0 && branchKey !== socket.branch.key) {
    switchBranch(socketId, socket, master, branchKey)
  }

  if (subscriptions) {
    syncSubscriptions(socket.branch, socketId, socket, master, subscriptions)
  }

  if (emits) {
    fireEmits(socket.branch, emits)
  }
}

export { incoming }
