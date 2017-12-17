let lastId = 0

const listen = (leaf, event, cb, id) => {
  if (!id) {
    id = lastId++
  }

  const listeners = leaf.branch.listeners

  if (!listeners[leaf.id]) {
    listeners[leaf.id] = { [ event ]: {} }
  } else if (!listeners[leaf.id][event]) {
    listeners[leaf.id][event] = {}
  }

  listeners[leaf.id][event][id] = cb

  return leaf
}

const unListen = (leaf, event, id) => {

}

const emit = (leaf, event, val, stamp) => {
  const oBranch = leaf.branch
  const listeners = leaf.branch.listeners

  if (listeners[leaf.id] && listeners[leaf.id][event]) {
    for (let fn in listeners[leaf.id][event]) {
      fn(val, stamp, leaf)
    }
  }

  leaf.branch.branches.forEach(branch => {
    leaf.branch = branch
    emit(leaf, event, val, stamp)
  })

  leaf.branch = oBranch
}

export { listen, unListen, emit }
