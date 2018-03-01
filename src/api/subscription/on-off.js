import { keyToId } from '../../id'
import { Leaf } from '../..'

let listenerLastId = 0

const parseOptions = (id, options, cb) => {
  if (options.excludeKeys) {
    if (options.keys) {
      options.keys = options.keys.filter(key => !~options.excludeKeys.indexOf(key))
      delete options.excludeKeys
    } else {
      options.excludeKeys = options.excludeKeys.map(key => keyToId(key, id))
    }
  }

  if (options.keys) {
    options.keys = options.keys.map(key => keyToId(key, id))
  }

  options.cb = cb
}

const subscribe = (branch, id, options, cb, listenerId) => {
  if (!listenerId) {
    listenerId = listenerLastId++
  }

  parseOptions(id, options, cb)
  const subscriptions = branch.subscriptions

  if (!subscriptions[id]) {
    subscriptions[id] = { listeners: {} }
  } else if (!subscriptions[id].listeners) {
    subscriptions[id].listeners = {}
  }

  subscriptions[id].listeners[listenerId] = options
  cb(new Leaf(branch, id), options)

  return listenerId
}

const unsubscribe = (branch, id, listenerId) => {
  if (branch.subscriptions[id] && branch.subscriptions[id].listeners && listenerId) {
    delete branch.subscriptions[id].listeners[listenerId]
  }
}

export { subscribe, unsubscribe }
