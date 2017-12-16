import { Struct } from '../index'
import { getString } from '../cache'
import { root } from '../id'
import { set } from './set'
import { getFromLeaves, origin, getApi } from './get'
import { compute } from './compute'
import { forEach, map, filter, find, reduce } from './array'
import { inspect, serialize } from './serialize'
import { listen, emit, unListen } from './listeners'

const define = (obj, key, val) => {
  Object.defineProperty(obj, key, { value: val, configurable: true })
}

const defineApi = (leaf, struct) => {
  /* ===== SHARED API ===== */

  // SET
  define(leaf, 'set', function (val, stamp) {
    set(this, val, stamp)
  })
  define(struct, 'set', function (val, stamp) {
    set(this.leaves[root], val, stamp)
  })

  // GET
  define(leaf, 'get', function (path, val, stamp) {
    return getApi(this, path, val, stamp)
  })
  define(struct, 'get', function (path, val, stamp) {
    return getApi(this.leaves[root], path, val, stamp)
  })

  // PARENT
  define(leaf, 'parent', function () {
    return getFromLeaves(this.branch, this.p)
  })
  define(struct, 'parent', function () {
    return void 0
  })

  // ROOT
  define(leaf, 'root', function () {
    return this.branch.leaves[root]
  })
  define(struct, 'root', function () {
    return this.leaves[root]
  })

  // INSPECT
  define(leaf, 'inspect', function () {
    return inspect(this.branch, this)
  })
  define(struct, 'inspect', function () {
    return inspect(this, this.leaves[root])
  })

  // SERIALIZE
  define(leaf, 'serialize', function () {
    return serialize(this.branch, this)
  })
  define(struct, 'serialize', function () {
    return serialize(this, this.leaves[root])
  })

  // PATH
  define(leaf, 'path', function () {
    let parent = this
    const path = []
    while (parent && parent.id !== root) {
      path.unshift(getString(parent.key))
      parent = getFromLeaves(this.branch, parent.p)
    }
    return path
  })
  define(struct, 'path', () => [])

  // FOREACH
  define(leaf, 'forEach', function (cb) {
    return forEach(this, cb)
  })
  define(struct, 'forEach', function (cb) {
    return forEach(this.leaves[root], cb)
  })

  // MAP
  define(leaf, 'map', function (cb) {
    return map(this, cb)
  })
  define(struct, 'map', function (cb) {
    return map(this.leaves[root], cb)
  })

  // FILTER
  define(leaf, 'filter', function (cb) {
    return filter(this, cb)
  })
  define(struct, 'filter', function (cb) {
    return filter(this.leaves[root], cb)
  })

  // FIND
  define(leaf, 'find', function (cb) {
    return find(this, cb)
  })
  define(struct, 'find', function (cb) {
    return find(this.leaves[root], cb)
  })

  // REDUCE
  define(leaf, 'reduce', function (cb, accumulator) {
    return reduce(this, cb, accumulator)
  })
  define(struct, 'reduce', function (cb, accumulator) {
    return reduce(this.leaves[root], cb, accumulator)
  })

  // ON
  define(leaf, 'on', function (event, cb, id) {
    return listen(this, event, cb, id)
  })
  define(struct, 'on', function (event, cb, id) {
    return listen(this.leaves[root], event, cb, id)
  })

  // OFF
  define(leaf, 'off', function (event, id) {
    return unListen(this, event, id)
  })
  define(struct, 'off', function (event, id) {
    return unListen(this.leaves[root], event, id)
  })

  // EMIT
  define(leaf, 'emit', function (event, val) {
    return emit(this, event, val)
  })
  define(struct, 'emit', function (event, val) {
    return emit(this.leaves[root], event, val)
  })

  /* ===== LEAF ONLY API ===== */

  // ISLEAF
  define(leaf, 'isLeaf', true)

  // ORIGIN
  define(leaf, 'origin', function () {
    return origin(this)
  })

  // COMPUTE
  define(leaf, 'compute', function () {
    return compute(this.branch, this.id)
  })

  /* ===== STRUCT ONLY API ===== */

  // CREATE
  define(struct, 'create', function (val, stamp) {
    return new Struct(val, stamp, this)
  })
}

export { defineApi, set }
