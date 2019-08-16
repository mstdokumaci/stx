import { addToStrings, getString } from './cache'
import { getRtFromLeaves } from './api/get'
import { addReferenceFrom, removeReferenceFrom } from './api/set/utils'

const bindAllDataListener = (branch, persist) => {
  if (!branch.listeners.allData) {
    branch.listeners.allData = {}
  }

  branch.listeners.allData['persist'] = (type, _, item) => {
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

    if (leaf.val !== void 0 || leaf.rT !== void 0) {
      const rTold = getRtFromLeaves(branch, id)
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
