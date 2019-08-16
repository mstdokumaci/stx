import { emit, addDataEvent } from './listeners/emit'
import { addOwnLeaf, addBranchLeaf, removeReferenceFrom } from './set/utils'
import { children } from './array'
import { getRtFromLeaves } from './get'

const removeListenersSubscriptions = (branch, id) => {
  delete branch.listeners[id]
  delete branch.subscriptions[id]
}

const removeReferenceFromBranches = (branch, rF, rT) => {
  removeReferenceFrom(branch, rF, rT)

  branch.branches.forEach(branch => {
    if (
      branch.leaves[rF] !== null &&
      (
        !branch.leaves[rF] ||
        (
          branch.leaves[rF].val === void 0 &&
          branch.leaves[rF].rT === void 0
        )
      )
    ) {
      removeReferenceFromBranches(branch, rF, rT)
    }
  })
}

const removeFromBranches = (branches, leaf, id, parent, keys, rT, stamp) =>
  branches.forEach(branch => {
    let parentNext = parent
    let keysNext = keys
    let rTnext = rT

    if (branch.leaves[id] === null) {
      delete branch.leaves[id]
      return
    } else {
      if (keys) {
        const addKeys = keys.filter(keyId => branch.leaves[keyId])
        if (addKeys.length) {
          const branchLeaf = addOwnLeaf(branch, id, leaf.parent, leaf.key, leaf.depth, stamp)
          branchLeaf.keys = [ ...addKeys ]
          keysNext = keys.filter(keyId => !branch.leaves[keyId])
        }
      }
      if (branch.leaves[id]) {
        if (parent) {
          const parentLeaf = addBranchLeaf(branch, parent, stamp)
          if (parentLeaf.keys) {
            parentLeaf.keys.push(id)
          } else {
            parentLeaf.keys = [ id ]
          }
          parentNext = void 0
        }
        if (
          rT &&
          branch.leaves[id].val === void 0 &&
          branch.leaves[id].rT === void 0
        ) {
          removeReferenceFrom(branch, id, rT)
        } else if (rT) {
          rTnext = void 0
        }
      } else {
        if (rT) {
          removeReferenceFrom(branch, id, rT)
        }
        if (parent) {
          if (branch.leaves[parent]) {
            branch.leaves[parent].stamp = stamp
          }
          addDataEvent(branch, parent, 'remove-key', leaf.depth)
        }
        removeListenersSubscriptions(branch, id)
      }
    }

    if (branch.branches.length) {
      removeFromBranches(branch.branches, leaf, id, parentNext, keysNext, rTnext, stamp)
    }
  })

const removeFromParent = (branch, parent, id, stamp, depth) => {
  if (branch.leaves[parent]) {
    const index = branch.leaves[parent].keys.indexOf(id)
    if (~index) {
      branch.leaves[parent].keys.splice(index, 1)
      branch.leaves[parent].stamp = stamp
      addDataEvent(void 0, parent, 'remove-key', depth)
      return parent
    }
  }
}

const removeOwn = (branch, leaf, id, rT, stamp, ignoreParent) => {
  delete branch.leaves[id]

  if (branch.persist) {
    branch.persist.remove(String(id))
  }

  const parent = ignoreParent ? void 0
    : removeFromParent(branch, leaf.parent, id, stamp, leaf.depth - 1)

  if (branch.branches.length) {
    removeFromBranches(branch.branches, leaf, id, parent, leaf.keys, rT, stamp)
  }
}

const removeInherited = (branch, leaf, id, rT, stamp, ignoreParent) => {
  if (!ignoreParent) {
    if (branch.leaves[leaf.parent]) {
      branch.leaves[leaf.parent].stamp = stamp
    }
    addDataEvent(void 0, leaf.parent, 'remove-key', leaf.depth - 1)
  }

  if (branch.branches.length) {
    removeFromBranches(
      branch.branches, leaf, id, ignoreParent ? void 0 : leaf.parent, leaf.keys, rT, stamp
    )
  }

  branch.leaves[id] = null

  if (branch.persist) {
    branch.persist.store(String(id), null)
  }
}

const removeChildren = (branch, id, stamp) => {
  children(branch, id, (subBranch, subId) =>
    remove(branch, subBranch.leaves[subId], subId, stamp, true)
  )
}

const remove = (branch, leaf, id, stamp, ignoreParent) => {
  emit(branch, id, 'data', 'remove', stamp)

  removeChildren(branch, id, stamp)

  const rT = getRtFromLeaves(branch, id)

  if (branch.leaves[id] === leaf) {
    removeOwn(branch, leaf, id, rT, stamp, ignoreParent)
  } else {
    removeInherited(branch, leaf, id, rT, stamp, ignoreParent)
  }

  if (rT) {
    removeReferenceFrom(branch, id, rT)
  }
  removeListenersSubscriptions(branch, id)
}

export { remove, removeOwn, removeListenersSubscriptions, removeReferenceFromBranches }
