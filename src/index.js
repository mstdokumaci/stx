import { root } from './id'
import { defineApi } from './api/index'
import { set } from './api/set'
import { createStamp } from './stamp'
import { emitDataEvents } from './api/listeners/emit'

const Leaf = function (branch, id) {
  this.branch = branch
  this.id = id
}

const create = function (val, stamp, inherits) {
  if (!stamp) {
    stamp = createStamp()
  }

  const branch = {
    branches: [],
    leaves: {},
    listeners: {},
    subscriptions: {},
    rF: {}
  }
  if (inherits) {
    branch.inherits = inherits
    inherits.branches.push(branch)
  }
  const rootLeaf = branch.leaves[root] = {}
  set(branch, rootLeaf, val, stamp)
  emitDataEvents(branch, stamp)
  return new Leaf(branch, rootLeaf)
}

defineApi(Leaf.prototype)

export { create, Leaf, createStamp }
