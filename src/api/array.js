import { getString } from '../cache'
import { getFromLeaves } from './get'

const children = (branch, leaf, cb) => {
  const exists = {}
  const oBranch = branch
  const id = leaf.id
  const subLeaves = []
  while (branch) {
    leaf = branch.leaves[id]
    if (leaf && leaf.keys) {
      const found = leaf.keys.find(leafId => {
        if (exists[leafId]) {
          return
        }
        if (exists[leafId] = getFromLeaves(oBranch, leafId)) {
          if (cb) {
            return cb(exists[leafId])
          } else {
            subLeaves.push(exists[leafId])
          }
        } else {
          exists[leafId] = true
        }
      })
      if (found) {
        return exists[found]
      }
    }
    branch = branch.inherits
  }
  return subLeaves
}

const forEach = (branch, leaf, cb) => {
  children(branch, leaf, subLeaf => {
    subLeaf.branch = branch
    cb(subLeaf, getString(subLeaf.key))
  })
}

const map = (branch, leaf, cb) => {
  const mapped = []
  children(branch, leaf, subLeaf => {
    subLeaf.branch = branch
    mapped.push(cb(subLeaf, getString(subLeaf.key)))
  })
  return mapped
}

const filter = (branch, leaf, cb) => {
  const filtered = []
  children(branch, leaf, subLeaf => {
    subLeaf.branch = branch
    if (cb(subLeaf, getString(subLeaf.key))) {
      filtered.push(subLeaf)
    }
  })
  return filtered
}

const find = (branch, leaf, cb) => {
  return Object.assign(children(branch, leaf, subLeaf => {
    subLeaf.branch = branch
    return cb(subLeaf, getString(subLeaf.key))
  }), { branch })
}

const reduce = (branch, leaf, cb, accumulator) => {
  let skipFirst = accumulator === void 0
  children(branch, leaf, subLeaf => {
    subLeaf.branch = branch
    if (skipFirst) {
      accumulator = subLeaf
      skipFirst = false
    } else {
      accumulator = cb(accumulator, subLeaf, getString(subLeaf.key))
    }
  })
  return accumulator
}

export { children, forEach, map, filter, find, reduce }
