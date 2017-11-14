import { root } from './id'
import { defineApi, set } from './api/index'

const Leaf = function (val, stamp, id, branch, parent, key) {
  this.id = id
  if (parent) {
    this.p = parent
  }
  if (key) {
    this.key = key
  }
  this.kBranch = branch
  if (val !== void 0) {
    set(this, val, stamp, id, branch)
  }
}

const Struct = function (val, stamp, inherits) {
  this.leaves = {}
  this.branches = []
  if (inherits) {
    this.inherits = inherits
    this.inherits.branches.push(this)
  }
  this.leaves[root] = new Leaf(val, stamp, root, this)
  this.leaves[root].branch = this
}

defineApi(Leaf.prototype, Struct.prototype)

export { Leaf, Struct }
