import { addToStrings, getString } from './cache'
import {
  addOwnLeaf,
  addOverrideLeaf,
  addOverrideLeafForKeys,
  addReferenceFrom,
  removeReferenceFrom
} from './api/set/utils'

const bindAllDataListener = (branch, persist) => {
  if (!branch.listeners.allData) {
    branch.listeners.allData = {}
  }

  branch.listeners.allData.persist = (type, _, item) => {
    if (type !== 'remove' && item.id in branch.leaves) {
      const leaf = branch.leaves[item.id]
      persist.store(
        String(item.id),
        {
          parent: leaf.parent,
          key: leaf.key,
          keyString: getString(leaf.key),
          keys: [...leaf.keys],
          stamp: leaf.stamp,
          depth: leaf.depth,
          val: leaf.val,
          rT: leaf.rT
        }
      )
    }
  }
}

const loadLeaf = (branch, id, leaf) => {
  if (leaf === null) {
    branch.leaves[id] = null
  } else {
    addToStrings(leaf.key, leaf.keyString)
    delete leaf.keyString

    if (branch.leaves[id]) {
      if (leaf.keys.length) {
        addOverrideLeafForKeys(branch, id)
      } else {
        addOverrideLeaf(branch, id)
      }
    } else {
      addOwnLeaf(branch, id, leaf.parent, leaf.key, leaf.depth, leaf.stamp)
    }

    leaf.keys.forEach(key => branch.leaves[id].keys.add(key))

    if (leaf.val !== undefined) {
      const rTold = branch.leaves[id] && branch.leaves[id].rT && branch.leaves[id].val
      if (rTold) {
        removeReferenceFrom(branch, id, rTold)
      }
      if (leaf.rT) {
        addReferenceFrom(branch, id, leaf.val)
      }
      branch.leaves[id].rT = leaf.rT
      branch.leaves[id].val = leaf.val
    }
  }
}

export {
  bindAllDataListener,
  loadLeaf
}
