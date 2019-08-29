import { addToStrings, getString } from './cache'
import { addReferenceFrom, removeReferenceFrom } from './api/set/utils'

const bindAllDataListener = (branch, persist) => {
  if (!branch.listeners.allData) {
    branch.listeners.allData = {}
  }

  branch.listeners.allData.persist = (type, _, item) => {
    if (type !== 'remove' && branch.leaves[item.id]) {
      persist.store(
        String(item.id),
        Object.assign(
          { keyString: getString(branch.leaves[item.id].key) },
          branch.leaves[item.id]
        )
      )
    }
  }
}

const loadLeaf = (branch, id, leaf) => {
  if (leaf !== null) {
    addToStrings(leaf.key, leaf.keyString)
    delete leaf.keyString

    if (leaf.val !== undefined || leaf.rT) {
      const rTold = branch.leaves[id] && branch.leaves[id].rT
      if (rTold) {
        removeReferenceFrom(branch, id, rTold)
      }
      if (leaf.rT) {
        addReferenceFrom(branch, id, leaf.rT)
      }
    }
  }

  branch.leaves[id] = leaf
}

export {
  bindAllDataListener,
  loadLeaf
}
