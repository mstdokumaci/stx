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

const addOwnLeaf = (branch, id, parent, key, stamp) => {
  branch.leaves[id] = { parent, key, stamp }
  if (branch.branches.length) {
    respectOverrides(branch.branches, id, parent)
  }
  return branch.leaves[id]
}

const addBranchLeaf = (branch, id, stamp) => {
  if (branch.leaves[id]) {
    return branch.leaves[id]
  } else {
    const fromLeaf = getFromLeaves(branch, id).leaves[id]
    return addOwnLeaf(branch, id, fromLeaf.parent, fromLeaf.key, stamp)
  }
}

const addBranchLeafFromLeaf = (branch, id, fromLeaf, stamp) => {
  if (branch.leaves[id]) {
    return branch.leaves[id]
  } else {
    return addOwnLeaf(branch, id, fromLeaf.parent, fromLeaf.key, stamp)
  }
}

const setVal = (branch, id, val, stamp) => {
  let leaf = getFromLeaves(branch, id).leaves[id]

  if (val !== leaf.val && val !== void 0) {
    leaf = addBranchLeafFromLeaf(branch, id, leaf, stamp)

    removeReference(branch, id, leaf.rT)
    leaf.rT = void 0
    leaf.val = val
    leaf.stamp = stamp

    addDataEvent(void 0, id, 'set')
  }
}

const cleanBranchRt = (branches, id, rT) =>
  branches.forEach(branch => {
    if (branch.leaves[id] === null) {
      return
    } else if (branch.leaves[id]) {
      if (branch.leaves[id].rT === rT) {
        addAfterEmitEvent(() => {
          removeReference(branch, id, rT)
          branch.leaves[id].rT = void 0
        })
      } else if (branch.leaves[id].rT !== void 0 || branch.leaves[id].val !== void 0) {
        return
      }
    }

    if (branch.branches.length) {
      cleanBranchRt(branch.branches, id, rT)
    }
  })

const setReference = (branch, id, rT, stamp) => {
  let leaf = getFromLeaves(branch, id).leaves[id]

  if (leaf.rT === rT) {
    return
  }

  leaf = addBranchLeafFromLeaf(branch, id, leaf, stamp)

  removeReference(branch, id, leaf.rT)
  leaf.val = void 0

  leaf.rT = rT
  leaf.stamp = stamp
  branch.rF[rT] = (branch.rF[rT] || []).concat(id)

  addDataEvent(void 0, id, 'set')

  if (branch.branches.length) {
    cleanBranchRt(branch.branches, id, rT)
  }
}

const setReferenceByPath = (branch, id, path, stamp) =>
  setReference(branch, id, getByPath(branch, root, path, {}, stamp), stamp)

const setReferenceByLeaf = (oBranch, id, rT, stamp) => {
  let branch = oBranch
  while (branch) {
    if (branch.leaves[rT] === null) {
      throw new Error('Reference must be in same branch')
    } else if (branch.leaves[rT]) {
      return setReference(oBranch, id, rT, stamp)
    }
    branch = branch.inherits
  }
  throw new Error('Reference must be in same branch')
}

const cleanBranchKeys = (branches, id, keys, stamp) =>
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
          addDataEvent(branch, id, 'add-key')
        }
      } else {
        addDataEvent(branch, id, 'add-key')
      }
    } else {
      addDataEvent(branch, id, 'add-key')
    }

    if (branch.branches.length && keysNext.length) {
      cleanBranchKeys(branch.branches, id, keysNext, stamp)
    }
  })

const setKeys = (branch, id, val, stamp) => {
  let keys = []
  for (let key in val) {
    if (key === 'val') {
      set(branch, id, val.val, stamp)
    } else {
      const subLeafId = keyToId(key, id)
      if (getFromLeaves(branch, subLeafId)) {
        set(branch, subLeafId, val[key], stamp)
      } else if (val[key] !== null) {
        const keyId = keyToId(key)
        addToStrings(keyId, key)
        keys.push(subLeafId)
        addOwnLeaf(branch, subLeafId, id, keyId, stamp)
        set(branch, subLeafId, val[key], stamp)
      }
    }
  }
  if (keys.length) {
    const leaf = addBranchLeaf(branch, id, stamp)
    leaf.keys = (leaf.keys || []).concat(keys)
    leaf.stamp = stamp
    cleanBranchKeys(branch.branches, id, keys, stamp)
    addDataEvent(void 0, id, 'add-key')
  }
}

const set = (branch, id, val, stamp) => {
  if (typeof val === 'object') {
    if (!val) {
      remove(branch, id, stamp)
    } else if (Array.isArray(val)) {
      if (val[0] === '@') {
        setReferenceByPath(branch, id, val.slice(1), stamp)
      } else {
        setVal(branch, id, val, stamp)
      }
    } else if (val.isLeaf) {
      setReferenceByLeaf(branch, id, val.id, stamp)
    } else {
      setKeys(branch, id, val, stamp)
    }
  } else {
    setVal(branch, id, val, stamp)
  }
}

export { set, addBranchLeaf }
