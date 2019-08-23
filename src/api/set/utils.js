import { getFromLeaves } from '../get'
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
  branch.leaves[id] = { parent, key, stamp, depth }
  if (branch.branches.length) {
    respectOverrides(branch.branches, id, parent)
  }
  return branch.leaves[id]
}

const addBranchLeaf = (branch, id, stamp) => {
  if (branch.leaves[id]) {
    return branch.leaves[id]
  } else {
    const fromLeaf = getFromLeaves(branch, id)
    return addOwnLeaf(
      branch, id, fromLeaf.parent, fromLeaf.key, fromLeaf.depth, stamp
    )
  }
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
    } else if (branch.leaves[rF]) {
      if (branch.leaves[rF].rT === rT) {
        addAfterEmitEvent(() => {
          branch.leaves[rF].rT = undefined
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

export {
  addOwnLeaf,
  addBranchLeaf,
  addReferenceFrom,
  removeReferenceFrom,
  checkReferenceByLeaf,
  fixBranchReferences,
  cleanBranchKeys
}
