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

  drainQueue(branch.client)
}

const removeSubscriptionToQueue = (branch, id, listenerId) => {
  branch.client.queue.s.push([ false, id, listenerId ])
}

const drainQueue = client => {
  if (
    client.socket &&
    client.socket.external &&
    (
      client.queue.b ||
      client.queue.s.length ||
      client.queue.e.length
    )
  ) {
    client.socket.send(JSON.stringify(client.queue))
    client.queue = { s: [], e: [] }
  }
}

export {
  addSubscriptionToQueue,
  sendAllSubscriptions,
  removeSubscriptionToQueue,
  drainQueue
}
