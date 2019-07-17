import { root } from './id'
import { createStamp } from './stamp'
import { set } from './api/set'
import { emitDataEvents } from './api/listeners/emit'
import { addToStrings, getString } from './cache'

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

const setToNewBranch = (branch, val, stamp) => {
  if (!stamp) {
    stamp = createStamp(branch.stamp)
  }

  set(branch, root, val, stamp)
  emitDataEvents(branch, stamp)
  return new Leaf(branch, root)
}

const prepareNewBranch = inherits => {
  const branch = {
    branches: [],
    leaves: { [ root ]: { depth: 0 } },
    listeners: {},
    subscriptions: {},
    parentSubscriptions: [],
    rF: {},
    stamp: { offset: 0 },
    client: {}
  }

  if (inherits) {
    branch.inherits = inherits
    inherits.branches.push(branch)
    for (const id in inherits.rF) {
      cloneIds(branch.rF, inherits.rF[id], id)
    }
    branch.stamp = inherits.stamp
  }

  if (inherits && typeof inherits.newBranchMiddleware === 'function') {
    inherits.newBranchMiddleware(new Leaf(branch, root))
  }

  return branch
}

const createPersist = (val, persist, stamp, inherits) => {
  const branch = prepareNewBranch(inherits)

  return persist.start(new Leaf(branch, root), addToStrings, getString)
    .then(() => persist.load())
    .then(() => setToNewBranch(branch, val, stamp))
}

const create = (val, stamp, inherits) => setToNewBranch(
  prepareNewBranch(inherits), val, stamp
)

export { create, createPersist, Leaf }
