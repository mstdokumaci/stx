import { create, Leaf } from '../index'
import { root } from '../id'
import { createStamp } from '../stamp'
import { set } from './set'
import { getFromLeaves, getApi } from './get'
import { origin, compute } from './compute'
import { forEach, map, filter, find, reduce } from './array'
import { path, inspect, serialize } from './serialize'
import { on, off, subscribe, unsubscribe } from './listeners/listen'
import { emit } from './listeners/emit'

const define = (obj, key, val) => {
  Object.defineProperty(obj, key, { value: val, configurable: true })
}

const defineApi = leaf => {
  // ISLEAF
  define(leaf, 'isLeaf', true)

  // CREATE
  define(leaf, 'create', function (val, stamp) {
    if (!stamp) {
      stamp = createStamp()
    }

    if (this.leaf.id === root) {
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

    set(this.branch, this.leaf, val, stamp)
    return this
  })

  // GET
  define(leaf, 'get', function (path, val, stamp) {
    if (!stamp) {
      stamp = createStamp()
    }

    const subLeaf = getApi(this.branch, this.leaf.id, path, val, stamp)
    if (subLeaf) {
      return new Leaf(this.branch, subLeaf)
    }
  })

  // PARENT
  define(leaf, 'parent', function () {
    const parent = getFromLeaves(this.branch, this.leaf.parent)
    if (parent) {
      return new Leaf(this.branch, parent)
    }
  })

  // ROOT
  define(leaf, 'root', function () {
    return new Leaf(this.branch, this.branch.leaves[root])
  })

  // ORIGIN
  define(leaf, 'origin', function () {
    return new Leaf(this.branch, origin(this.branch, this.leaf))
  })

  // COMPUTE
  define(leaf, 'compute', function () {
    return compute(this.branch, this.leaf.id)
  })

  // PATH
  define(leaf, 'path', function () {
    return path(this.branch, this.leaf)
  })

  // INSPECT
  define(leaf, 'inspect', function () {
    return inspect(this.branch, this.leaf)
  })

  // SERIALIZE
  define(leaf, 'serialize', function () {
    return serialize(this.branch, this.leaf)
  })

  // FOREACH
  define(leaf, 'forEach', function (cb) {
    return forEach(this.branch, this.leaf, cb)
  })

  // MAP
  define(leaf, 'map', function (cb) {
    return map(this.branch, this.leaf, cb)
  })

  // FILTER
  define(leaf, 'filter', function (cb) {
    return filter(this.branch, this.leaf, cb)
  })

  // FIND
  define(leaf, 'find', function (cb) {
    return find(this.branch, this.leaf, cb)
  })

  // REDUCE
  define(leaf, 'reduce', function (cb, accumulator) {
    return reduce(this.branch, this.leaf, cb, accumulator)
  })

  // ON
  define(leaf, 'on', function (event, cb, id) {
    on(this.branch, this.leaf, event, cb, id)
    return this
  })

  // OFF
  define(leaf, 'off', function (event, id) {
    off(this.branch, this.leaf, event, id)
    return this
  })

  // SUBSCRIBE
  define(leaf, 'subscribe', function (cb, id) {
    subscribe(this.branch, this.leaf, cb, id)
    return this
  })

  // UNSUBSCRIBE
  define(leaf, 'unsubscribe', function (id) {
    unsubscribe(this.branch, this.leaf, id)
    return this
  })

  // EMIT
  define(leaf, 'emit', function (event, val, stamp) {
    if (!stamp) {
      stamp = createStamp()
    }

    emit(this.branch, this.leaf, event, val, stamp)
    return this
  })
}

export { defineApi, set }
