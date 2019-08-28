import { emit, addDataEvent } from './listeners/emit'
import { addOverrideLeaf, removeReferenceFrom } from './set/utils'
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
          branch.leaves[rF].val === undefined &&
          branch.leaves[rF].rT === undefined
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
        const addKeys = keys.filter(keyId => keyId in branch.leaves)
        if (addKeys.length) {
          const branchLeaf = addOverrideLeaf(branch, id, true)
          addKeys.forEach(key => { branchLeaf.keys[key] = true })
          keysNext = keys.filter(keyId => !(keyId in branch.leaves))
        }
      }
      if (branch.leaves[id]) {
        if (parent) {
          const pLeaf = addOverrideLeaf(branch, id, true)
          pLeaf.keys[id] = true
          parentNext = undefined
        }
        if (
          rT &&
          branch.leaves[id].val === undefined &&
          branch.leaves[id].rT === undefined
        ) {
          removeReferenceFrom(branch, id, rT)
        } else if (rT) {
          rTnext = undefined
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
  if (
    Object.prototype.hasOwnProperty.call(branch.leaves, parent) &&
    Object.prototype.hasOwnProperty.call(branch.leaves[parent], 'keys') &&
    Object.prototype.hasOwnProperty.call(branch.leaves[parent].keys, id)
  ) {
    delete branch.leaves[parent].keys[id]
    branch.leaves[parent].stamp = stamp
    addDataEvent(undefined, parent, 'remove-key', depth)
  }
}

const removeOwn = (branch, id, rT, stamp, ignoreParent) => {
  const leaf = branch.leaves[id]
  const keys = Object.keys(leaf.keys)
  keys.forEach(key => delete leaf.keys[key])

  if (branch.persist) {
    branch.persist.remove(String(id))
  }

  const parent = ignoreParent ? undefined
    : removeFromParent(branch, leaf.parent, id, stamp, leaf.depth - 1)

  if (branch.branches.length) {
    removeFromBranches(branch.branches, leaf, id, parent, keys, rT, stamp)
  }

  delete branch.leaves[id]
}

const removeInherited = (branch, id, rT, stamp, ignoreParent) => {
  const leaf = branch.leaves[id]
  if (!ignoreParent) {
    if (Object.prototype.hasOwnProperty.call(branch.leaves, leaf.parent)) {
      branch.leaves[leaf.parent].stamp = stamp
    } else {
      const pLeaf = addOverrideLeaf(branch, id)
      pLeaf.stamp = stamp
    }
    addDataEvent(undefined, leaf.parent, 'remove-key', leaf.depth - 1)
  }

  if (branch.branches.length) {
    removeFromBranches(
      branch.branches, leaf, id, ignoreParent ? undefined : leaf.parent, Object.keys(leaf.keys), rT, stamp
    )
  }

  branch.leaves[id] = null

  if (branch.persist) {
    branch.persist.store(String(id), null)
  }
}

const removeChildren = (branch, id, stamp) => {
  for (const key in branch.leaves[id].keys) {
    if (branch.leaves[id] !== null) {
      remove(branch, key, stamp, true)
    }
  }
}

const remove = (branch, id, stamp, ignoreParent) => {
  emit(branch, id, 'data', 'remove', stamp)

  removeChildren(branch, id, stamp)

  const rT = getRtFromLeaves(branch, id)

  if (Object.prototype.hasOwnProperty.call(branch.leaves, id)) {
    removeOwn(branch, id, rT, stamp, ignoreParent)
  } else {
    removeInherited(branch, id, rT, stamp, ignoreParent)
  }

  if (rT) {
    removeReferenceFrom(branch, id, rT)
  }
  removeListenersSubscriptions(branch, id)
}

export { remove, removeOwn, removeListenersSubscriptions, removeReferenceFromBranches }
