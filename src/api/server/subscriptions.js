import { sendData, sendLeaves, removeLeaves } from './send'

const syncSubscriptions = (branch, socketId, socket, master, subscriptions) => {
  let data = {}

  subscriptions.forEach(subscription => {
    const [ add, id, listenerId, keys, excludeKeys, depth, limit ] = subscription
    if (add) {
      if (!branch.subscriptions[id]) {
        branch.subscriptions[id] = { listeners: {} }
      } else if (!branch.subscriptions[id].listeners) {
        branch.subscriptions[id].listeners = {}
      }

      branch.subscriptions[id].listeners[`${socketId}-${listenerId}`] = {
        keys,
        excludeKeys,
        depth,
        limit,
        cb: sendLeaves.bind(null, socket, master)
      }

      data = sendLeaves(
        socket,
        master,
        { branch, id },
        { keys, excludeKeys, depth, limit },
        data
      )
    } else if (branch.subscriptions[id] && branch.subscriptions[id].listeners) {
      delete branch.subscriptions[id].listeners[`${socketId}-${listenerId}`]
    }
  })

  sendData(socket, branch, data)
}

const addAllDataListener = (branch, socketId, socket, master) => {
  if (!branch.listeners.allData) {
    branch.listeners.allData = {}
  }
  branch.listeners.allData[socketId] = removeLeaves.bind(null, socket, master)
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
