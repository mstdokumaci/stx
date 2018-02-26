import { create } from '../..'
import { emit } from '../listeners/emit'

const switchBranch = (socket, master, branchKey) => {
  let branch = master.branches.find(branch => branch.key === branchKey)

  if (!branch) {
    branch = create(void 0, void 0, master).branch
    branch.key = branchKey
  }

  socket.branch = branch
}

const syncSubscriptions = (branch, subscriptions) => {

}

const fireEmits = (branch, emits) => {
  emits.forEach(([ id, event, val, stamp ]) => emit(branch, id, event, val, stamp))
}

const setLeaves = (branch, leaves) => {

}

const incoming = (server, socketId, socket, master, data) => {
  const { b: branchKey, s: subscriptions, e: emits, l: leaves } = data

  if (branchKey !== void 0 && branchKey !== socket.branch.key) {
    switchBranch(socket, master, branchKey)
  }

  if (subscriptions) {
    syncSubscriptions(socket.branch, subscriptions)
  }

  if (emits) {
    fireEmits(socket.branch, emits)
  }

  if (leaves) {
    setLeaves(socket.branch, leaves)
  }
}

export { incoming }
