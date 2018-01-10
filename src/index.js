import { root } from './id'
import { defineApi } from './api/index'
import { set } from './api/set/index'
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
    leaves: { [ root ]: {} },
    listeners: {},
    subscriptions: {},
    rF: {}
  }
  if (inherits) {
    branch.inherits = inherits
    inherits.branches.push(branch)
  }
  set(branch, root, val, stamp)
  emitDataEvents(branch, stamp)
  return new Leaf(branch, root)
}

defineApi(Leaf.prototype)

export { create, Leaf, createStamp }
