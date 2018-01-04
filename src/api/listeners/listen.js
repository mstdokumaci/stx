let listenerLastId = 0
let subscriptionLastId = 0

const on = (branch, leaf, event, cb, id) => {
  if (!id) {
    id = listenerLastId++
  }

  const listeners = branch.listeners

  if (!listeners[leaf.id]) {
    listeners[leaf.id] = { [ event ]: {} }
  } else if (!listeners[leaf.id][event]) {
    listeners[leaf.id][event] = {}
  }

  listeners[leaf.id][event][id] = cb
}

const off = (branch, leaf, event, id) => {
  if (branch.listeners[leaf.id] && branch.listeners[leaf.id][event] && id) {
    delete branch.listeners[leaf.id][event][id]
  }
}

const subscribe = (branch, leaf, cb, id) => {
  if (!id) {
    id = subscriptionLastId++
  }

  const subscriptions = branch.subscriptions

  if (!subscriptions[leaf.id]) {
    subscriptions[leaf.id] = {}
  }

  subscriptions[leaf.id][id] = cb
}

const unsubscribe = (branch, leaf, id) => {
  if (branch.subscriptions[leaf.id] && id) {
    delete branch.subscriptions[leaf.id][id]
  }
}

export { on, off, subscribe, unsubscribe }
