let listenerLastId = 0

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

export { on, off }
