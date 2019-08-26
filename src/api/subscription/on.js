import { keyToId, pathToId } from '../../id'
import define from '../../define'
import { Leaf } from '../../leaf'
import {
  addSubscriptionToQueue,
  removeSubscriptionToQueue,
  drainQueue
} from '../client/send'

let listenerLastId = 0

const Subscription = function (branch, id, listenerId) {
  this.branch = branch
  this.id = id
  this.listenerId = listenerId
}

define(Subscription.prototype, 'unsubscribe', function () {
  if (this.branch.subscriptions[this.id]) {
    delete this.branch.subscriptions[this.id].listeners[this.listenerId]

    if (this.branch.client.queue) {
      removeSubscriptionToQueue(this.branch, this.id, this.listenerId)
      drainQueue(this.branch.client)
    }
  }
})

const parseOptions = (id, options, cb) => {
  if (options.excludeKeys) {
    if (options.keys) {
      options.keys = options.keys.filter(key => !options.excludeKeys.includes(key))
      delete options.excludeKeys
    } else {
      options.excludeKeys = options.excludeKeys.map(key => keyToId(key, id))
    }
  }

  if (options.keys) {
    options.keys = options.keys.map(key => keyToId(key, id))
  }

  if (options.sort && options.sort.path) {
    options.sort.path = pathToId(options.sort.path, id)

    if (![Number, String].includes(options.sort.type)) {
      options.sort.type = String
    }
  }

  options.cb = cb
}

const subscribe = (branch, id, options, cb) => {
  const listenerId = listenerLastId++

  parseOptions(id, options, cb)
  const subscriptions = branch.subscriptions

  if (!subscriptions[id]) {
    subscriptions[id] = { listeners: {} }
  } else if (!subscriptions[id].listeners) {
    subscriptions[id].listeners = {}
  }

  subscriptions[id].listeners[listenerId] = options
  cb(new Leaf(branch, id), options)

  if (branch.client.queue) {
    addSubscriptionToQueue(branch, id, listenerId)
    drainQueue(branch.client)
  }

  return new Subscription(branch, id, listenerId)
}

export { subscribe }
