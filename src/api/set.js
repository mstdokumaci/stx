import { addToStrings } from '../cache'
import { root, keyToId } from '../id'
import { getFromLeaves, getByPath } from './get'
import { remove, removeReference } from './remove'
import { emit } from './listeners'

const respectOverrides = (branches, id, parent) =>
  branches.forEach(branch => {
    if (branch.leaves[parent] === null) {
      branch.leaves[id] = null
    }
    if (branch.branches.length) {
      respectOverrides(branch.branches, id, parent)
    }
  })

const addLeaf = (struct, id, parent, key) => {
  struct.leaves[id] = { struct, id, parent, key }
  if (struct.branches.length) {
    respectOverrides(struct.branches, id, parent)
  }
  return struct.leaves[id]
}

const setVal = (branch, leaf, val, stamp) => {
  if (val === leaf.val && val !== void 0) {
    return leaf
  }
  if (leaf.struct !== branch) {
    leaf = addLeaf(branch, leaf.id, leaf.parent, leaf.key)
    if (val !== void 0) {
      set(branch, leaf, val, stamp)
    }
  } else if (val !== void 0) {
    leaf.val = val
    removeReference(branch, leaf, stamp)
    emit(branch, leaf, 'data', 'set', stamp)
  }
  return leaf
}

const cleanBranchRef = (branches, id, rF) =>
  branches.forEach(branch => {
    if (branch.leaves[id] === null) {
      return
    } else if (branch.leaves[id]) {
      if (branch.leaves[id].rF) {
        const index = branch.leaves[id].rF.indexOf(rF)
        if (~index) {
          branch.leaves[id].rF.splice(index, 1)
          return
        }
      }
    }

    if (branch.branches.length) {
      cleanBranchRef(branch.branches, id, rF)
    }
  })

const setReference = (branch, leaf, val, stamp) => {
  if (leaf.rT === val.id) {
    return
  }
  removeReference(branch, leaf)
  leaf = setVal(branch, leaf, void 0, stamp)
  leaf.val = void 0
  leaf.rT = val.id
  if (val.rF) {
    val.rF.push(leaf.id)
  } else {
    val.rF = [ leaf.id ]
  }
  if (val.struct.branches.length) {
    cleanBranchRef(val.struct.branches, val.id, leaf.id)
  }
  emit(branch, leaf, 'data', 'set', stamp)
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
          emit(branch, leaf, 'data', 'add-key', stamp)
        }
      } else {
        emit(branch, leaf, 'data', 'add-key', stamp)
      }
    } else {
      emit(branch, leaf, 'data', 'add-key', stamp)
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
        const subLeaf = addLeaf(branch, subLeafId, leaf.id, keyId)
        set(branch, subLeaf, val[key], stamp)
      }
    }
  }
  if (keys.length) {
    leaf = setVal(branch, leaf, void 0, stamp)
    leaf.keys = leaf.keys ? leaf.keys.concat(keys) : keys
    cleanBranchKeys(branch.branches, leaf, leaf.id, keys, stamp)
    emit(branch, leaf, 'data', 'add-key', stamp)
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

export { set, setVal }
