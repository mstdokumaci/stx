import { sendData, sendLeaves, removeLeaves } from './send'

const syncSubscriptions = (branch, socket, subscriptions) => {
  const data = { leaves: {}, strings: {} }

  subscriptions.forEach(subscription => {
    const [add, id, listenerId, keys, excludeKeys, depth, sort, limit] = subscription
    if (add && (id in branch.leaves)) {
      if (!branch.subscriptions[id]) {
        branch.subscriptions[id] = { listeners: {} }
      } else if (!branch.subscriptions[id].listeners) {
        branch.subscriptions[id].listeners = {}
      }

      branch.subscriptions[id].listeners[`${socket.id}-${listenerId}`] = {
        keys,
        excludeKeys,
        depth,
        sort,
        limit,
        cb: sendLeaves.bind(null, socket)
      }

      sendLeaves(
        socket,
        { branch, id },
        { keys, excludeKeys, depth, sort, limit },
        data
      )
    } else if (branch.subscriptions[id] && branch.subscriptions[id].listeners) {
      delete branch.subscriptions[id].listeners[`${socket.id}-${listenerId}`]
    }
  })

  sendData(socket, branch, data)
}

const addAllDataListener = (branch, socket) => {
  if (!branch.listeners.allData) {
    branch.listeners.allData = {}
  }
  branch.listeners.allData[socket.id] = removeLeaves.bind(null, socket)
}

const removeSubscriptionsAndAllDataListener = (branch, socketId) => {
  for (const id in branch.subscriptions) {
    for (const listenerId in branch.subscriptions[id].listeners) {
      if (listenerId.indexOf(socketId) === 0) {
        delete branch.subscriptions[id].listeners[listenerId]
      }
    }
  }

  delete branch.listeners.allData[socketId]
}

export {
  syncSubscriptions,
  addAllDataListener,
  removeSubscriptionsAndAllDataListener
}
