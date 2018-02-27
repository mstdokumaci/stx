const removeSubscriptions = (branch, socketId) => {
  for (const id in branch.subscriptions) {
    for (const listenerId in branch.subscriptions[id].listeners) {
      if (listenerId.indexOf(socketId) === 0) {
        delete branch.subscriptions[id].listeners[listenerId]
      }
    }
  }
}

export { removeSubscriptions }
