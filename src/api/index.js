import { create, Leaf } from '..'
import { root } from '../id'
import define from '../define'
import { createStamp } from '../stamp'
import { set } from './set'
import { getBranchForId, getApi } from './get'
import { origin, compute } from './compute'
import { forEach, map, filter, find, reduce } from './array'
import { path, inspect, serialize } from './serialize'
import { on, off } from './listeners/on-off'
import { subscribe, unsubscribe } from './subscription/on-off'
import { emit, emitDataEvents } from './listeners/emit'
import { listen } from './server'
import { connect } from './client'

const defineApi = leaf => {
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
      stamp = createStamp()
    }

    set(this.branch, this.id, val, stamp)
    emitDataEvents(this.branch, stamp)
    return this
  })

  // GET
  define(leaf, 'get', function (path, val, stamp) {
    if (!stamp && val !== void 0) {
      stamp = createStamp()
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
    const leafBranch = getBranchForId(this.branch, this.id)
    if (leafBranch.leaves[this.id].parent) {
      return new Leaf(this.branch, leafBranch.leaves[this.id].parent)
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
    return compute(this.branch, this.id)
  })

  // PATH
  define(leaf, 'path', function () {
    return path(this.branch, this.id)
  })

  // INSPECT
  define(leaf, 'inspect', function () {
    return inspect(this.branch, this.id)
  })

  // SERIALIZE
  define(leaf, 'serialize', function () {
    return serialize(this.branch, this.id)
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
  define(leaf, 'on', function (event, cb, listenerId) {
    on(this.branch, this.id, event, cb, listenerId)
    return this
  })

  // OFF
  define(leaf, 'off', function (event, listenerId) {
    off(this.branch, this.id, event, listenerId)
    return this
  })

  // SUBSCRIBE
  define(leaf, 'subscribe', function (options, cb, listenerId) {
    if (typeof options === 'function') {
      listenerId = cb
      cb = options
      options = {}
    }
    subscribe(this.branch, this.id, options, cb, listenerId)
    return this
  })

  // UNSUBSCRIBE
  define(leaf, 'unsubscribe', function (listenerId) {
    unsubscribe(this.branch, this.id, listenerId)
    return this
  })

  // EMIT
  define(leaf, 'emit', function (event, val, stamp) {
    if (!stamp) {
      stamp = createStamp()
    }

    emit(this.branch, this.id, event, val, stamp)
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
}

export { define, defineApi }
