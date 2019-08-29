import { addAfterEmitEvent, addDataEvent } from '../listeners/emit'

const respectOverrides = (branches, id, parent) =>
  branches.forEach(branch => {
    if (branch.leaves[parent] === null) {
      branch.leaves[id] = null
      if (branch.persist) {
        branch.persist.store(String(id), null)
      }
    }
    if (branch.branches.length) {
      respectOverrides(branch.branches, id, parent)
    }
  })

const overrideBranches = (branch, id, keys, leaf = true) => {
  branch.branches.forEach(subBranch => {
    if (subBranch.leaves[id] === null) {
      return
    }
    if (Object.prototype.hasOwnProperty.call(subBranch.leaves, id)) {
      if (leaf) {
        Object.setPrototypeOf(subBranch.leaves[id], branch.leaves[id])
      }
      if (keys && Object.prototype.hasOwnProperty.call(subBranch.leaves[id], 'keys')) {
        Object.setPrototypeOf(subBranch.leaves[id].keys, branch.leaves[id].keys)
      } else if (subBranch.branches.length) {
        overrideBranches(subBranch, id, keys, false)
      }
    } else if (subBranch.branches.length) {
      overrideBranches(subBranch, id, keys)
    }
  })
}

const addOwnLeaf = (branch, id, parent, key, depth, stamp) => {
  branch.leaves[id] = { parent, key, stamp, depth, keys: {} }
  if (branch.branches.length) {
    respectOverrides(branch.branches, id, parent)
  }
  if (branch.branches.length) {
    overrideBranches(branch, id, true)
  }
  return branch.leaves[id]
}

const addOverrideLeaf = (branch, id, keys, leaf = true) => {
  if (leaf) {
    branch.leaves[id] = Object.create(branch.leaves[id])
  }
  if (keys) {
    branch.leaves[id].keys = Object.create(branch.inherits.leaves[id].keys)
  }
  if (branch.branches.length) {
    overrideBranches(branch, id, keys)
  }
  return branch.leaves[id]
}

const addReferenceFrom = (branch, rF, rT) => {
  if (!branch.rF[rT]) {
    branch.rF[rT] = []
  }
  branch.rF[rT].push(rF)
}

const removeReferenceFrom = (branch, rF, rT) =>
  branch.rF[rT].splice(branch.rF[rT].indexOf(rF), 1)

const fixBranchReferences = (branches, rF, rT, rTold) =>
  branches.forEach(branch => {
    if (branch.leaves[rF] === null) {
      return
    } else if (!Object.prototype.hasOwnProperty.call(branch.leaves, rF)) {
      if (rTold) {
        removeReferenceFrom(branch, rF, rTold)
      }
      addReferenceFrom(branch, rF, rT)
    } else if (Object.prototype.hasOwnProperty.call(branch.leaves[rF], 'rT')) {
      if (branch.leaves[rF].rT === rT) {
        addAfterEmitEvent(() => {
          delete branch.leaves[rF].rT
        })
      } else {
        return
      }
    } else if (Object.prototype.hasOwnProperty.call(branch.leaves[rF], 'val')) {
      return
    } else {
      if (rTold) {
        removeReferenceFrom(branch, rF, rTold)
      }
      addReferenceFrom(branch, rF, rT)
    }

    if (branch.branches.length) {
      fixBranchReferences(branch.branches, rF, rT)
    }
  })

const checkReferenceByLeaf = (branch, rTBranch, rT, cb) => {
  if (
    (
      rTBranch === branch ||
      Object.prototype.isPrototypeOf.call(rTBranch.leaves, branch.leaves)
    ) &&
    branch.leaves[rT] !== null
  ) {
    return cb()
  } else {
    throw new Error('Reference must be in same branch')
  }
}

const cleanBranchKeys = (branches, id, keys, stamp) =>
  branches.forEach(branch => {
    const keysNext = keys.slice()
    if (branch.leaves[id] === null) {
      return
    } else if (
      Object.prototype.hasOwnProperty.call(branch.leaves, id) &&
      Object.prototype.hasOwnProperty.call(branch.leaves[id], 'keys')
    ) {
      Object.keys(branch.leaves[id].keys).forEach(key => {
        const index = keysNext.indexOf(key)
        if (~index) {
          delete branch.leaves[id].keys[key]
          keysNext.splice(index, 1)
        }
      })

      if (keysNext.length) {
        addDataEvent(branch, id, 'add-key')
      }
    } else {
      addDataEvent(branch, id, 'add-key')
    }

    if (branch.branches.length && keysNext.length) {
      cleanBranchKeys(branch.branches, id, keysNext, stamp)
    }
  })

export {
  addOwnLeaf,
  addOverrideLeaf,
  addReferenceFrom,
  removeReferenceFrom,
  checkReferenceByLeaf,
  fixBranchReferences,
  cleanBranchKeys
}
