import { Leaf } from '../../index'

let listenerLastId = 0

const subscribe = (branch, id, options, cb, listenerId) => {
  if (!listenerId) {
    listenerId = listenerLastId++
  }

  const subscriptions = branch.subscriptions

  if (!subscriptions[id]) {
    subscriptions[id] = { listeners: [] }
  } else if (!subscriptions[id].listeners) {
    subscriptions[id].listeners = []
  }

  subscriptions[id].listeners[listenerId] = cb
  cb(new Leaf(branch, id))
}

const unsubscribe = (branch, id, listenerId) => {
  if (branch.subscriptions[id] && branch.subscriptions[id].listeners && listenerId) {
    delete branch.subscriptions[id].listeners[listenerId]
  }
}

export { subscribe, unsubscribe }
