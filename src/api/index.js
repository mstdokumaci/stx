import { create, Leaf } from '../leaf'
import { root } from '../id'
import define from '../define'
import { createStamp } from '../stamp'
import { set } from './set'
import { getApi } from './get'
import { origin, compute } from './compute'
import { forEach, map, filter, find, reduce } from './array'
import { path, inspect, serialize } from './serialize'
import { on } from './listeners/on'
import { subscribe } from './subscription/on'
import { emit, emitDataEvents } from './listeners/emit'
import { listen } from './server'
import { connect } from './client'
import { sendAllSubscriptions, drainQueue } from './client/send'

const defineApi = (leaf) => {
  // ISLEAF
  define(leaf, 'isLeaf', true)

  // CREATE
  define(leaf, 'create', function (val, stamp) {
    if (this.id === root) {
      return create(val, stamp, this.branch)
    } else {
      throw new Error('Can not create from leaf')
    }
  })

  // SET
  define(leaf, 'set', function (val, stamp) {
    if (!stamp) {
      stamp = createStamp(this.branch.stamp)
    }

    const stopSending = this.branch.client.stopSending
    this.branch.client.stopSending = false
    set(this.branch, this.id, val, stamp)
    emitDataEvents(this.branch, stamp)
    this.branch.client.stopSending = stopSending
    return this
  })

  // GET
  define(leaf, 'get', function (path, val, stamp) {
    if (!stamp && val !== undefined) {
      stamp = createStamp(this.branch.stamp)
    }

    const subId = getApi(this.branch, this.id, path, val, stamp)
    if (subId) {
      if (stamp) {
        emitDataEvents(this.branch, stamp)
      }
      return new Leaf(this.branch, subId)
    }
  })

  // PARENT
  define(leaf, 'parent', function () {
    if (this.branch.leaves[this.id].parent) {
      return new Leaf(this.branch, this.branch.leaves[this.id].parent)
    }
  })

  // ROOT
  define(leaf, 'root', function () {
    return new Leaf(this.branch, root)
  })

  // ORIGIN
  define(leaf, 'origin', function () {
    return new Leaf(this.branch, origin(this.branch, this.id))
  })

  // COMPUTE
  define(leaf, 'compute', function () {
    return compute(this.branch, this.branch.leaves[this.id])
  })

  // PATH
  define(leaf, 'path', function () {
    return path(this.branch, this.id)
  })

  // INSPECT
  define(leaf, 'inspect', function () {
    return inspect(this.branch, this.branch.leaves[this.id])
  })

  // SERIALIZE
  define(leaf, 'serialize', function () {
    return serialize(this.branch, this.branch.leaves[this.id])
  })

  // FOREACH
  define(leaf, 'forEach', function (cb) {
    return forEach(this.branch, this.id, cb)
  })

  // MAP
  define(leaf, 'map', function (cb) {
    return map(this.branch, this.id, cb)
  })

  // FILTER
  define(leaf, 'filter', function (cb) {
    return filter(this.branch, this.id, cb)
  })

  // FIND
  define(leaf, 'find', function (cb) {
    return find(this.branch, this.id, cb)
  })

  // REDUCE
  define(leaf, 'reduce', function (cb, accumulator) {
    return reduce(this.branch, this.id, cb, accumulator)
  })

  // ON
  define(leaf, 'on', function (event, cb) {
    if (typeof event === 'function') {
      cb = event
      event = 'data'
    }

    return on(this.branch, this.id, event, cb)
  })

  // SUBSCRIBE
  define(leaf, 'subscribe', function (options, cb) {
    if (typeof options === 'function') {
      cb = options
      options = {}
    }

    return subscribe(this.branch, this.id, options, cb)
  })

  // EMIT
  define(leaf, 'emit', function (event, val, stamp) {
    if (!stamp) {
      stamp = createStamp(this.branch.stamp)
    }

    emit(this.branch, this.id, event, val, stamp)

    if (this.branch.client.queue && event !== 'data') {
      this.branch.client.queue.e.push([this.id, event, val, stamp])
      drainQueue(this.branch.client)
    }

    return this
  })

  // LISTEN
  define(leaf, 'listen', function (port) {
    return listen(this.branch, port)
  })

  // CONNECT
  define(leaf, 'connect', function (url) {
    return connect(this.branch, url)
  })

  // SWITCH BRANCH
  define(leaf, 'switchBranch', function (branchKey) {
    if (this.branch.client.queue) {
      this.branch.client.queue.b = branchKey
      sendAllSubscriptions(this.branch)
    }
  })
}

export { defineApi, define }
