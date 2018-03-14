const addSubscriptionToQueue = (branch, id, listenerId) => {
  const sub = branch.subscriptions[id].listeners[listenerId]
  branch.client.queue.s.push(
    [ true, id, listenerId, sub.keys, sub.excludeKeys, sub.depth, sub.limit ]
  )
}

const sendAllSubscriptions = branch => {
  for (const id in branch.subscriptions) {
    for (const listenerId in branch.subscriptions[id].listeners) {
      addSubscriptionToQueue(branch, id, listenerId)
    }
  }

  drainQueue(branch)
}

const removeSubscriptionToQueue = (branch, id, listenerId) => {
  branch.client.queue.s.push([ false, id, listenerId ])
}

const drainQueue = branch => {
  if (
    branch.client.socket &&
    branch.client.socket.external &&
    (
      branch.client.queue.s.length ||
      branch.client.queue.e.length
    )
  ) {
    branch.client.socket.send(JSON.stringify(branch.client.queue))
    branch.client.queue = { s: [], e: [] }
  }
}

export {
  addSubscriptionToQueue,
  sendAllSubscriptions,
  removeSubscriptionToQueue,
  drainQueue
}
