const addSubscriptionToQueue = (branch, id, listenerId) => {
  const sub = branch.subscriptions[id].listeners[listenerId]
  branch.client.queue.s.push(
    [true, id, listenerId, sub.keys, sub.excludeKeys, sub.depth, sub.limit]
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

const sendSetExisting = (type, stamp, leaf) => {
  if (!leaf.branch.client.stopSending && type === 'set') {
    const { val, rT } = leaf.branch.leaves[leaf.id]

    leaf.branch.client.queue.l.push([leaf.id, stamp, val, rT])
  }
}

const addAllDataListener = branch => {
  if (!branch.listeners.allData) {
    branch.listeners.allData = {}
  }

  branch.listeners.allData.client = sendSetExisting
}

const removeAllDataListener = branch => {
  delete branch.listeners.allData.client
}

const removeSubscriptionToQueue = (branch, id, listenerId) => {
  branch.client.queue.s.push([false, id, listenerId])
}

const drainQueue = client => {
  if (
    client.socket &&
    (
      client.queue.b ||
      client.queue.s.length ||
      client.queue.l.length ||
      client.queue.e.length
    )
  ) {
    client.socket.send(JSON.stringify(client.queue))
    client.queue = { s: [], l: [], e: [] }
  }
}

export {
  addSubscriptionToQueue,
  sendAllSubscriptions,
  sendSetExisting,
  addAllDataListener,
  removeAllDataListener,
  removeSubscriptionToQueue,
  drainQueue
}
