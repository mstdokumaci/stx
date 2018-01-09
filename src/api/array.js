import { Leaf } from '../index'
import { getString } from '../cache'
import { getFromLeaves } from './get'
import { compute } from './compute'

const children = (oBranch, id, cb) => {
  const exists = {}
  let branch = oBranch
  const subLeaves = []
  while (branch) {
    const leaf = branch.leaves[id]
    if (leaf === null) {
      return subLeaves
    } else if (leaf && leaf.keys) {
      const found = leaf.keys.find(leafId => {
        if (exists[leafId]) {
          return
        }
        const subBranch = getFromLeaves(oBranch, leafId)
        if (subBranch) {
          exists[leafId] = subBranch
          if (cb) {
            return cb(subBranch, leafId)
          } else {
            subLeaves.push([ subBranch, leafId ])
          }
        } else {
          exists[leafId] = true
        }
      })
      if (found) {
        return {
          branch: exists[found],
          id: found
        }
      }
    }
    branch = branch.inherits
  }
  return subLeaves
}

const forEach = (branch, id, cb) => {
  children(branch, id, (subBranch, id) => {
    cb(new Leaf(branch, id), getString(subBranch.leaves[id].key))
  })
}

const map = (branch, id, cb) => {
  const mapped = []
  children(branch, id, (subBranch, id) => {
    mapped.push(cb(new Leaf(branch, id), getString(subBranch.leaves[id].key)))
  })
  return mapped
}

const filter = (branch, id, cb) => {
  const filtered = []
  children(branch, id, (subBranch, id) => {
    const subLeafInstance = new Leaf(branch, id)
    if (cb(subLeafInstance, getString(subBranch.leaves[id].key))) {
      filtered.push(subLeafInstance)
    }
  })
  return filtered
}

const find = (branch, id, cb) => {
  const found = children(branch, id, (subBranch, id) => {
    return cb(new Leaf(branch, id), getString(subBranch.leaves[id].key))
  })
  if (!Array.isArray(found)) {
    return new Leaf(found.branch, found.id)
  }
}

const reduce = (branch, id, cb, accumulator) => {
  let skipFirst = accumulator === void 0
  children(branch, id, (subBranch, id) => {
    if (skipFirst) {
      accumulator = compute(subBranch, id)
      skipFirst = false
    } else {
      accumulator = cb(accumulator, new Leaf(branch, id), getString(subBranch.leaves[id].key))
    }
  })
  return accumulator
}

export { children, forEach, map, filter, find, reduce }
