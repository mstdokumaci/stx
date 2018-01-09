import { create, Leaf } from '../index'
import { root } from '../id'
import { createStamp } from '../stamp'
import { set } from './set'
import { getFromLeaves, getApi } from './get'
import { origin, compute } from './compute'
import { forEach, map, filter, find, reduce } from './array'
import { path, inspect, serialize } from './serialize'
import { on, off, subscribe, unsubscribe } from './listeners/listen'
import { emit, emitDataEvents } from './listeners/emit'

const define = (obj, key, val) => {
  Object.defineProperty(obj, key, { value: val, configurable: true })
}

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
    const leafBranch = getFromLeaves(this.branch, this.id)
    const parentId = leafBranch.leaves[this.id].parent
    if (getFromLeaves(this.branch, parentId)) {
      return new Leaf(this.branch, parentId)
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
  define(leaf, 'subscribe', function (cb, listenerId) {
    subscribe(this.branch, this.id, cb, listenerId)
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
}

export { defineApi, set }
