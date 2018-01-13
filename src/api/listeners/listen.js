import { Leaf } from '../../index'

let listenerLastId = 0
let subscriptionLastId = 0

const on = (branch, id, event, cb, listenerId) => {
  if (!listenerId) {
    listenerId = listenerLastId++
  }

  const listeners = branch.listeners

  if (!listeners[id]) {
    listeners[id] = { [ event ]: {} }
  } else if (!listeners[id][event]) {
    listeners[id][event] = {}
  }

  listeners[id][event][listenerId] = cb
}

const off = (branch, id, event, listenerId) => {
  if (branch.listeners[id] && branch.listeners[id][event] && listenerId) {
    delete branch.listeners[id][event][listenerId]
  }
}

const subscribe = (branch, id, cb, listenerId) => {
  if (!listenerId) {
    listenerId = subscriptionLastId++
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

export { on, off, subscribe, unsubscribe }
