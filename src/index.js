import { root } from './id'
import { defineApi } from './api/index'
import { set } from './api/set'

const Leaf = function (branch, leaf) {
  this.branch = branch
  this.leaf = leaf
}

const create = function (val, stamp, inherits) {
  const struct = {
    leaves: {},
    branches: [],
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
  return new Leaf(struct, rootLeaf)
}

defineApi(Leaf.prototype)

export { create, Leaf }
