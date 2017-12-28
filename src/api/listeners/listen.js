let lastId = 0

const on = (branch, leaf, event, cb, id) => {
  if (!id) {
    id = lastId++
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

export { on, off }
