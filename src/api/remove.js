import { emit, addDataEvent } from './listeners/emit'
import {
  addOverrideLeaf,
  addOverrideLeafForKeys,
  removeReferenceFrom
} from './set/utils'

const removeListenersSubscriptions = (branch, id) => {
  delete branch.listeners[id]
  delete branch.subscriptions[id]
}

const removeReferenceFromBranches = (branch, rF, rT) => {
  removeReferenceFrom(branch, rF, rT)

  branch.branches.forEach(branch => {
    if (
      branch.leaves[rF] !== null && (
        !Object.prototype.hasOwnProperty.call(branch.leaves, rF) ||
        !Object.prototype.hasOwnProperty.call(branch.leaves[rF], 'val')
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
        const addKeys = keys.filter(keyId => keyId in branch.leaves && branch.leaves[keyId] !== null)
        if (addKeys.length) {
          const branchLeaf = addOverrideLeafForKeys(branch, id)
          addKeys.forEach(key => { branchLeaf.keys.add(key) })
          keysNext = keys.filter(keyId => !(keyId in branch.leaves) || branch.leaves[keyId] === null)
        }
      }
      if (Object.prototype.hasOwnProperty.call(branch.leaves, id)) {
        if (parent) {
          const pLeaf = addOverrideLeafForKeys(branch, parent)
          pLeaf.keys.add(id)
          parentNext = undefined
        }
        if (
          rT &&
          branch.leaves[id].val === undefined
        ) {
          removeReferenceFrom(branch, id, rT)
        } else if (rT) {
          rTnext = undefined
        }
      } else {
        if (rT) {
          removeReferenceFrom(branch, id, rT)
        }
        if (parent && branch.leaves[parent]) {
          if (Object.prototype.hasOwnProperty.call(branch.leaves, parent)) {
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

const removeFromParent = (branch, parent, id, stamp) => {
  if (
    Object.prototype.hasOwnProperty.call(branch.leaves, parent) &&
    Object.prototype.hasOwnProperty.call(branch.leaves[parent], 'keys')
  ) {
    branch.leaves[parent].keys.delete(id)
    branch.leaves[parent].stamp = stamp
    addDataEvent(undefined, parent, 'remove-key', branch.leaves[parent].depth)
    return parent
  }
}

const removeOwn = (branch, id, rT, stamp, ignoreParent) => {
  const leaf = branch.leaves[id]
  const keys = [...leaf.keys]
  if (Object.prototype.hasOwnProperty.call(leaf, 'keys')) {
    leaf.keys.clear()
  }
  delete leaf.val
  delete leaf.rT

  if (branch.persist) {
    branch.persist.remove(String(id))
  }

  const parent = ignoreParent ? undefined
    : removeFromParent(branch, leaf.parent, id, stamp)

  if (branch.branches.length) {
    removeFromBranches(branch.branches, leaf, id, parent, keys, rT, stamp)
  }

  delete branch.leaves[id]

  if (branch.persist) {
    branch.persist.store(String(id), null)
  }
}

const removeInherited = (branch, id, rT, stamp, ignoreParent) => {
  const leaf = branch.leaves[id]
  if (!ignoreParent) {
    const pLeaf = addOverrideLeaf(branch, leaf.parent)
    pLeaf.stamp = stamp
    addDataEvent(undefined, leaf.parent, 'remove-key', leaf.depth - 1)
  }

  if (branch.branches.length) {
    removeFromBranches(
      branch.branches, leaf, id, ignoreParent ? undefined : leaf.parent, [...leaf.keys], rT, stamp
    )
  }

  branch.leaves[id] = null

  if (branch.persist) {
    branch.persist.store(String(id), null)
  }
}

const removeChildren = (branch, id, stamp) => {
  branch.leaves[id].keys.forEach(key => {
    if (branch.leaves[key] !== null) {
      remove(branch, key, stamp, true)
    }
  })
}

const remove = (branch, id, stamp, ignoreParent) => {
  emit(branch, id, 'data', 'remove', stamp)

  removeChildren(branch, id, stamp)

  const rT = branch.leaves[id].rT && branch.leaves[id].val

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
