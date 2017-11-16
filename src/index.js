import { root } from './id'
import { defineApi, set } from './api/index'

const Leaf = function (branch, id, val, stamp, parent, key) {
  this.id = id
  if (parent) {
    this.p = parent
  }
  if (key) {
    this.key = key
  }
  this.struct = branch
  if (val !== void 0) {
    set(branch, this, id, val, stamp)
  }
}

const Struct = function (val, stamp, inherits) {
  this.leaves = {}
  this.branches = []
  if (inherits) {
    this.inherits = inherits
    this.inherits.branches.push(this)
  }
  this.leaves[root] = new Leaf(this, root, val, stamp)
  this.leaves[root].branch = this
}

defineApi(Leaf.prototype, Struct.prototype)

export { Leaf, Struct }
