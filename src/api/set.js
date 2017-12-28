import { addToStrings } from '../cache'
import { root, keyToId } from '../id'
import { getFromLeaves, getByPath } from './get'
import { remove, removeReference } from './remove'
import { emit } from './listeners/emit'

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
  struct.leaves[id] = { struct, id, parent, key }
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
    leaf.val = val

    removeReference(branch, leaf, stamp)
    emit(branch, leaf, 'data', 'set', stamp)
  }
}

const cleanBranchRf = (branches, id, rF) =>
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
      cleanBranchRf(branch.branches, id, rF)
    }
  })

const cleanBranchRt = (branches, id) =>
  branches.forEach(branch => {
    if (branch.leaves[id] === null) {
      return
    } else if (branch.leaves[id]) {
      delete branch.leaves[id].rT
      return
    }

    if (branch.branches.length) {
      cleanBranchRt(branch.branches, id)
    }
  })

const setReference = (branch, leaf, val, stamp) => {
  if (leaf.rT === val.id) {
    return
  }

  removeReference(branch, leaf)

  leaf = addBranchLeaf(branch, leaf, stamp)
  delete leaf.val
  leaf.rT = val.id

  if (val.rF) {
    val.rF.push(leaf.id)
  } else {
    val.rF = [ leaf.id ]
  }

  if (val.struct.branches.length) {
    cleanBranchRf(val.struct.branches, val.id, leaf.id)
  }

  emit(branch, leaf, 'data', 'set', stamp)

  if (branch.branches.length) {
    cleanBranchRt(branch.branches, leaf.id)
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
        const subLeaf = addOwnLeaf(branch, subLeafId, leaf.id, keyId, stamp)
        set(branch, subLeaf, val[key], stamp)
      }
    }
  }
  if (keys.length) {
    leaf = addBranchLeaf(branch, leaf, stamp)
    leaf.keys = (leaf.keys || []).concat(keys)
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

export { set, addBranchLeaf }
