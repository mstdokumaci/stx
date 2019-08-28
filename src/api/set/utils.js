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

const addOwnLeaf = (branch, id, parent, key, depth, stamp) => {
  branch.leaves[id] = { parent, key, stamp, depth, keys: {} }
  if (branch.branches.length) {
    respectOverrides(branch.branches, id, parent)
  }
  return branch.leaves[id]
}

const overrideBranches = (branch, id, keys, leaf) => {
  branch.branches.forEach(subBranch => {
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

const addOverrideLeaf = (branch, id, keys, leaf = true) => {
  if (leaf) {
    branch.leaves[id] = Object.create(branch.leaves[id])
  }
  if (keys) {
    branch.leaves[id].keys = Object.create(branch.inherits.leaves[id].keys)
  }
  if (branch.branches.length) {
    overrideBranches(branch, id, keys, leaf)
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
    } else if (Object.prototype.hasOwnProperty.call(branch.leaves, rF)) {
      if (branch.leaves[rF].rT === rT) {
        addAfterEmitEvent(() => {
          delete branch.leaves[rF].rT
        })
      } else if (branch.leaves[rF].rT !== undefined || branch.leaves[rF].val !== undefined) {
        return
      } else {
        if (rTold) {
          removeReferenceFrom(branch, rF, rTold)
        }
        addReferenceFrom(branch, rF, rT)
      }
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

const checkReferenceByLeaf = (oBranch, rTBranch, rT, cb) => {
  let branch = oBranch
  while (branch) {
    if (branch.leaves[rT] === null) {
      throw new Error('Reference must be in same branch')
    } else if (branch === rTBranch) {
      return cb()
    }
    branch = branch.inherits
  }
  throw new Error('Reference must be in same branch')
}

const cleanBranchKeys = (branches, id, keys, stamp) =>
  branches.forEach(branch => {
    const keysNext = keys.slice()
    if (branch.leaves[id] === null) {
      return
    } else if (!Object.prototype.hasOwnProperty.call(branch.leaves, id)) {
      addDataEvent(branch, id, 'add-key')
    } else {
      Object.keys(branch.leaves[id].keys).forEach(key => {
        const index = keysNext.indexOf(key)
        if (~index) {
          keysNext.splice(index, 1)
        } else {
          delete branch.leaves[id].keys[key]
        }
      })

      if (keysNext.length) {
        addDataEvent(branch, id, 'add-key')
      }
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
