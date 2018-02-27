import { create } from '../..'
import { emit } from '../listeners/emit'
import { removeSubscriptions } from './subscriptions'
import { sendLeaves } from './send'

const switchBranch = (socketId, socket, master, branchKey) => {
  let branch = master.branches.find(branch => branch.key === branchKey)

  if (!branch) {
    branch = create(void 0, void 0, master).branch
    branch.key = branchKey
  }

  removeSubscriptions(socket.branch, socketId)

  socket.branch = branch
}

const syncSubscriptions = (branch, socketId, socket, isMaster, subscriptions) => {
  subscriptions.forEach(subscription => {
    const [ add, id, listenerId, keys, excludeKeys, depth, limit ] = subscription
    if (add) {
      if (!branch.subscriptions[id]) {
        branch.subscriptions[id] = { listeners: {} }
      } else if (!branch.subscriptions[id].listeners) {
        branch.subscriptions[id].listeners = {}
      }

      branch.subscriptions[id].listeners[`${socketId}-${listenerId}`] = sendLeaves.bind(
        null, socket, branch, isMaster, id, keys, excludeKeys, depth, limit
      )

      sendLeaves(socket, branch, isMaster, id, keys, excludeKeys, depth, limit)
    } else if (branch.subscriptions[id] && branch.subscriptions[id].listeners) {
      delete branch.subscriptions[id].listeners[`${socketId}-${listenerId}`]
    }
  })
}

const fireEmits = (branch, emits) => {
  emits.forEach(([ id, event, val, stamp ]) => emit(branch, id, event, val, stamp))
}

const setLeaves = (branch, leaves) => {

}

const incoming = (server, socketId, socket, master, data) => {
  const { b: branchKey, s: subscriptions, e: emits, l: leaves } = data

  if (branchKey !== void 0 && branchKey !== socket.branch.key) {
    switchBranch(socketId, socket, master, branchKey)
  }

  if (subscriptions) {
    syncSubscriptions(
      socket.branch, socketId, socket, socket.branch === master, subscriptions
    )
  }

  if (emits) {
    fireEmits(socket.branch, emits)
  }

  if (leaves) {
    setLeaves(socket.branch, leaves)
  }
}

export { incoming }
