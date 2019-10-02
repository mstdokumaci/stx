import { setOffset } from '../../stamp'
import { remove, removeReferenceFromBranches } from '../remove'
import { addOwnLeaf } from '../set/utils'
import { setOwnExistingVal, setOwnExistingReference } from '../set/own-existing'
import { setOwnNewVal, setOwnNewReference } from '../set/own-new'
import { addDataEvent, emitDataEvents } from '../listeners/emit'
import { addToStrings } from '../../cache'

const cleanLeaves = (branch, list) => {
  for (let id in list) {
    id = Number(id)
    if (id in branch.leaves) {
      const leaf = branch.leaves[id]
      const rT = leaf.rT && leaf.val
      const parent = leaf.parent
      delete branch.leaves[id]
      if (!(parent in list) && parent in branch.leaves) {
        branch.leaves[parent].keys.delete(id)
        branch.leaves[parent].stamp = list[id]
      }
      if (rT) {
        removeReferenceFromBranches(branch, id, rT)
      }
    }
  }
}

const removeLeaves = (branch, list) => {
  for (const id in list) {
    const stamp = list[id]
    if (branch.leaves[id]) {
      remove(branch, Number(id), stamp)
    }
  }
}

const setLeaves = (branch, leaves) => {
  for (let id in leaves) {
    id = Number(id)
    const [key, parent, stamp, val, rT, keys, depth] = leaves[id]

    if (id in branch.leaves) {
      const leaf = branch.leaves[id]

      if (rT) {
        setOwnExistingReference(branch, leaf, id, val, stamp)
      } else if (val !== null) {
        setOwnExistingVal(branch, leaf, id, val, stamp)
      }

      if (keys && keys.length) {
        let added = false
        keys.forEach(key => {
          if (!leaf.keys.has(key)) {
            leaf.keys.add(key)
            added = true
          }
        })
        if (added) {
          addDataEvent(undefined, id, 'add-key')
        }
      }
    } else {
      const leaf = addOwnLeaf(branch, id, parent, key, depth, stamp)

      if (rT) {
        setOwnNewReference(branch, leaf, id, val, stamp)
      } else if (val !== null) {
        setOwnNewVal(branch, leaf, id, val, stamp)
      }

      if (keys && keys.length) {
        keys.forEach(key => leaf.keys.add(key))
        addDataEvent(undefined, id, 'add-key')
      }
    }
  }
}

const setStrings = strings => {
  for (const id in strings) {
    addToStrings(id, strings[id])
  }
}

const incoming = (branch, data) => {
  const { t: stamp, l: leaves, c: clean, s: strings, r: remove } = data

  if (stamp !== undefined) {
    setOffset(branch.stamp, stamp)
  }

  branch.client.stopSending = true

  if (clean) {
    cleanLeaves(branch, clean)
  }

  if (remove) {
    removeLeaves(branch, remove)
  }

  if (strings) {
    setStrings(strings)
  }

  if (leaves) {
    setLeaves(branch, leaves)
  }

  emitDataEvents(branch, stamp)
  branch.client.stopSending = false
}

export { incoming }
