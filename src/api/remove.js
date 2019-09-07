import { emit, addDataEvent } from './listeners/emit'
import {
  addOwnLeaf,
  addOverrideLeaf,
  addOverrideLeafForKeys,
  removeReferenceFrom
} from './set/utils'
import ExtendableSet from '../extendable-set'

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

const removeFromBranches = (branches, leaf, id, parent, keys, ownKeys, rT, stamp) =>
  branches.forEach(branch => {
    let leafNext = leaf
    let parentNext = parent
    let keysNext = keys
    let ownKeysNext = ownKeys
    let rTnext = rT

    if (branch.leaves[id] === null) {
      delete branch.leaves[id]
      return
    } else {
      let branchLeaf

      if (Object.prototype.hasOwnProperty.call(branch.leaves, id)) {
        branchLeaf = branch.leaves[id]
        if (leaf) {
          Object.setPrototypeOf(branchLeaf, null)
          branchLeaf.parent = leaf.parent
          branchLeaf.key = leaf.key
          branchLeaf.depth = leaf.depth
          branchLeaf.stamp = stamp
          if (!branchLeaf.keys) {
            branchLeaf.keys = new ExtendableSet()
          }
          leafNext = false
        }
        if (ownKeys && Object.prototype.hasOwnProperty.call(branchLeaf, 'keys')) {
          branchLeaf.keys.updateInheritance(null)
          ownKeysNext = false
        }
      }

      if (keys.length) {
        const addKeys = new Set(keys.filter(
          key => Object.prototype.hasOwnProperty.call(branch.leaves, key) && branch.leaves[key] !== null
        ))
        if (addKeys.size) {
          if (!branchLeaf && leaf) {
            branchLeaf = addOwnLeaf(branch, id, leaf.parent, leaf.key, leaf.depth, leaf.stamp)
            leafNext = false
            ownKeysNext = false
          } else {
            branchLeaf = addOverrideLeafForKeys(branch, id)
          }
          addKeys.forEach(key => { branchLeaf.keys.add(key) })
          keysNext = keys.filter(key => !addKeys.has(key))
        }
      }

      if (branchLeaf) {
        if (rT) {
          if (branchLeaf.val === undefined) {
            removeReferenceFrom(branch, id, rT)
          } else {
            rTnext = false
          }
        }

        if (parent) {
          const pLeaf = addOverrideLeafForKeys(branch, parent)
          pLeaf.keys.add(id)
          parentNext = false
        }
      } else {
        if (rT) {
          removeReferenceFrom(branch, id, rT)
        }
        if (parent) {
          const pLeaf = branch.leaves[parent]
          if (Object.prototype.hasOwnProperty.call(branch.leaves, parent)) {
            pLeaf.stamp = stamp
          }
          addDataEvent(branch, parent, 'remove-key', pLeaf.depth)
        }
        removeListenersSubscriptions(branch, id)
      }
    }

    if (branch.branches.length) {
      removeFromBranches(branch.branches, leafNext, id, parentNext, keysNext, ownKeysNext, rTnext, stamp)
    }
  })

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

  const leaf = branch.leaves[id]
  const rT = leaf.rT && leaf.val

  if (!ignoreParent && leaf.parent) {
    let pLeaf = branch.leaves[leaf.parent]
    if (!Object.prototype.hasOwnProperty.call(branch.leaves, leaf.parent)) {
      pLeaf = addOverrideLeaf(branch, leaf.parent)
    } else if (Object.prototype.hasOwnProperty.call(pLeaf, 'keys')) {
      pLeaf.keys.delete(id)
    }
    pLeaf.stamp = stamp
    addDataEvent(undefined, leaf.parent, 'remove-key', pLeaf.depth)
  }

  if (branch.branches.length) {
    removeFromBranches(
      branch.branches, leaf, id, !ignoreParent && leaf.parent, [...leaf.keys], true, rT, stamp
    )
  }

  branch.leaves[id] = null

  if (branch.persist) {
    branch.persist.store(String(id), null)
  }

  if (rT) {
    removeReferenceFrom(branch, id, rT)
  }
  removeListenersSubscriptions(branch, id)
}

export { remove, removeListenersSubscriptions, removeReferenceFromBranches }
