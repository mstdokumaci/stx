import { root } from './id'
import { defineApi } from './api/index'
import { set } from './api/set/index'
import { createStamp } from './stamp'
import { emitDataEvents } from './api/listeners/emit'

const cloneIds = (to, from, parent) => {
  for (const id in from) {
    if (!to[parent]) {
      to[parent] = {}
    }
    if (!to[id]) {
      to[id] = {}
    }
    to[parent][id] = to[id]
    cloneIds(to, from[id], id)
  }
}

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
    for (const id in inherits.rF) {
      cloneIds(branch.rF, inherits.rF[id], id)
    }
  }
  set(branch, root, val, stamp)
  emitDataEvents(branch, stamp)
  return new Leaf(branch, root)
}

defineApi(Leaf.prototype)

export { create, Leaf, createStamp }
