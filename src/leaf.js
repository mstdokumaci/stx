import { root } from './id'
import { createStamp } from './stamp'
import { set } from './api/set'
import { emitDataEvents } from './api/listeners/emit'
import { bindAllDataListener, loadLeaf } from './persist'

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
  const branch = Object.create(null, {
    branches: { value: [] },
    listeners: { value: {} },
    subscriptions: { value: {} },
    parentSubscriptions: { value: [] },
    rF: { value: {} },
    client: { value: {} }
  })

  if (inherits) {
    Object.defineProperties(branch, {
      leaves: { value: Object.create(inherits.leaves) },
      stamp: { value: inherits.stamp },
      inherits: { value: inherits }
    })
    inherits.branches.push(branch)
    for (const id in inherits.rF) {
      branch.rF[id] = inherits.rF[id].slice(0)
    }
  } else {
    const leaves = Object.create(null)
    leaves[root] = { keys: {}, depth: 0 }
    Object.defineProperties(branch, {
      leaves: { value: leaves },
      stamp: { value: { offset: 0 } }
    })
  }

  if (inherits && typeof inherits.newBranchMiddleware === 'function') {
    inherits.newBranchMiddleware(new Leaf(branch, root))
  }

  return branch
}

const createPersist = (val, persist, stamp, inherits) => {
  const branch = prepareNewBranch(inherits)

  branch.persist = persist
  return persist.start()
    .then(() => persist.load((id, leaf) => loadLeaf(branch, id, leaf)))
    .then(() => bindAllDataListener(branch, persist))
    .then(() => setToNewBranch(branch, val, stamp))
}

const create = (val, stamp, inherits) => setToNewBranch(
  prepareNewBranch(inherits), val, stamp
)

export { create, createPersist, Leaf }
