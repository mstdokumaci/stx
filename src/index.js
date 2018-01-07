import { root } from './id'
import { defineApi } from './api/index'
import { set } from './api/set'
import { createStamp } from './stamp'
import { emitDataEvents } from './api/listeners/emit'

const Leaf = function (branch, leaf) {
  this.branch = branch
  this.leaf = leaf
}

const create = function (val, stamp, inherits) {
  if (!stamp) {
    stamp = createStamp()
  }

  const struct = {
    branches: [],
    leaves: {},
    listeners: {},
    subscriptions: {},
    rF: {}
  }
  if (inherits) {
    struct.inherits = inherits
    inherits.branches.push(struct)
  }
  const rootLeaf = struct.leaves[root] = {
    id: root,
    struct
  }
  set(struct, rootLeaf, val, stamp)
  emitDataEvents(struct, stamp)
  return new Leaf(struct, rootLeaf)
}

defineApi(Leaf.prototype)

export { create, Leaf, createStamp }
