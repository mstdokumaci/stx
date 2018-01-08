import { addToStrings } from '../cache'
import { root, keyToId } from '../id'
import { getFromLeaves, getByPath } from './get'
import { remove, removeReference } from './remove'
import { addDataEvent, addAfterEmitEvent } from './listeners/emit'

const respectOverrides = (branches, id, parent) =>
  branches.forEach(branch => {
    if (branch.leaves[parent] === null) {
      branch.leaves[id] = null
    }
    if (branch.branches.length) {
      respectOverrides(branch.branches, id, parent)
    }
  })

const addOwnLeaf = (struct, id, parent, key, stamp) => {
  struct.leaves[id] = { struct, id, parent, key, stamp }
  if (struct.branches.length) {
    respectOverrides(struct.branches, id, parent)
  }
  return struct.leaves[id]
}

const addBranchLeaf = (branch, fromLeaf, stamp) => {
  return fromLeaf.struct === branch ? fromLeaf
    : addOwnLeaf(branch, fromLeaf.id, fromLeaf.parent, fromLeaf.key, stamp)
}

const setVal = (branch, leaf, val, stamp) => {
  if (val !== leaf.val && val !== void 0) {
    leaf = addBranchLeaf(branch, leaf, stamp)

    removeReference(branch, leaf, stamp)
    leaf.val = val
    leaf.stamp = stamp

    addDataEvent(void 0, leaf, 'set')
  }
}

const cleanBranchRt = (branches, id, rT) =>
  branches.forEach(branch => {
    if (branch.leaves[id] === null) {
      return
    } else if (branch.leaves[id]) {
      if (branch.leaves[id].rT === rT) {
        addAfterEmitEvent(removeReference.bind(null, branch, branch.leaves[id]))
      } else if (branch.leaves[id].rT !== void 0 || branch.leaves[id].val !== void 0) {
        return
      }
    }

    if (branch.branches.length) {
      cleanBranchRt(branch.branches, id, rT)
    }
  })

const setReference = (branch, leaf, val, stamp) => {
  if (leaf.rT === val.id) {
    return
  }

  leaf = addBranchLeaf(branch, leaf, stamp)

  removeReference(branch, leaf)
  delete leaf.val

  leaf.rT = val.id
  leaf.stamp = stamp
  branch.rF[val.id] = (branch.rF[val.id] || []).concat(leaf.id)

  addDataEvent(void 0, leaf, 'set')

  if (branch.branches.length) {
    cleanBranchRt(branch.branches, leaf.id, val.id)
  }
}

const setReferenceByPath = (branch, leaf, path, stamp) =>
  setReference(branch, leaf, getByPath(branch, root, path, {}, stamp), stamp)

const setReferenceByLeaf = (oBranch, leaf, val, stamp) => {
  let branch = oBranch
  while (branch) {
    if (branch.leaves[val.id] === null) {
      throw new Error('Reference must be in same branch')
    } else if (branch === val.struct) {
      return setReference(oBranch, leaf, val, stamp)
    }
    branch = branch.inherits
  }
  throw new Error('Reference must be in same branch')
}

const cleanBranchKeys = (branches, leaf, id, keys, stamp) =>
  branches.forEach(branch => {
    let keysNext = keys.slice()

    if (branch.leaves[id] === null) {
      return
    } else if (branch.leaves[id]) {
      if (branch.leaves[id].keys) {
        const firstLength = branch.leaves[id].keys.length
        branch.leaves[id].keys = branch.leaves[id].keys.filter(key => {
          const index = keys.indexOf(key)
          if (~index) {
            keysNext.splice(index, 1)
          } else {
            return true
          }
        })
        if (branch.leaves[id].keys.length === firstLength) {
          addDataEvent(branch, leaf, 'add-key')
        }
      } else {
        addDataEvent(branch, leaf, 'add-key')
      }
    } else {
      addDataEvent(branch, leaf, 'add-key')
    }

    if (branch.branches.length && keysNext.length) {
      cleanBranchKeys(branch.branches, leaf, id, keysNext, stamp)
    }
  })

const setKeys = (branch, leaf, val, stamp) => {
  let keys = []
  for (let key in val) {
    if (key === 'val') {
      set(branch, leaf, val.val, stamp)
    } else {
      const subLeafId = keyToId(key, leaf.id)
      const existing = getFromLeaves(branch, subLeafId)
      if (existing) {
        set(branch, existing, val[key], stamp)
      } else if (val[key] !== null) {
        const keyId = keyToId(key)
        addToStrings(keyId, key)
        keys.push(subLeafId)
        const subLeaf = addOwnLeaf(branch, subLeafId, leaf.id, keyId, stamp)
        set(branch, subLeaf, val[key], stamp)
      }
    }
  }
  if (keys.length) {
    leaf = addBranchLeaf(branch, leaf, stamp)
    leaf.keys = (leaf.keys || []).concat(keys)
    leaf.stamp = stamp
    cleanBranchKeys(branch.branches, leaf, leaf.id, keys, stamp)
    addDataEvent(void 0, leaf, 'add-key')
  }
}

const set = (branch, leaf, val, stamp) => {
  if (typeof val === 'object') {
    if (!val) {
      remove(branch, leaf, stamp)
    } else if (Array.isArray(val)) {
      if (val[0] === '@') {
        setReferenceByPath(branch, leaf, val.slice(1), stamp)
      } else {
        setVal(branch, leaf, val, stamp)
      }
    } else if (val.isLeaf) {
      setReferenceByLeaf(branch, leaf, val.leaf, stamp)
    } else {
      setKeys(branch, leaf, val, stamp)
    }
  } else {
    setVal(branch, leaf, val, stamp)
  }
}

export { set, addBranchLeaf }
