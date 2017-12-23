import { getString } from '../cache'
import { getFromLeaves } from './get'

const children = (leaf, cb) => {
  const exists = {}
  let branch = leaf.struct
  const oBranch = leaf.branch
  const id = leaf.id
  const subLeaves = []
  while (branch) {
    leaf = branch.leaves[id]
    if (leaf === null) {
      return subLeaves
    } else if (leaf && leaf.keys) {
      const found = leaf.keys.find(leafId => {
        if (exists[leafId]) {
          return
        }
        const subLeaf = getFromLeaves(oBranch, leafId)
        if (subLeaf) {
          exists[leafId] = subLeaf
          if (cb) {
            return cb(subLeaf)
          } else {
            subLeaves.push(subLeaf)
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

const forEach = (leaf, cb) => {
  children(leaf, subLeaf => {
    cb(subLeaf, getString(subLeaf.key))
  })
}

const map = (leaf, cb) => {
  const mapped = []
  children(leaf, subLeaf => {
    mapped.push(cb(subLeaf, getString(subLeaf.key)))
  })
  return mapped
}

const filter = (leaf, cb) => {
  const filtered = []
  children(leaf, subLeaf => {
    if (cb(subLeaf, getString(subLeaf.key))) {
      filtered.push(subLeaf)
    }
  })
  return filtered
}

const find = (leaf, cb) => {
  return children(leaf, subLeaf => {
    return cb(subLeaf, getString(subLeaf.key))
  })
}

const reduce = (leaf, cb, accumulator) => {
  let skipFirst = accumulator === void 0
  children(leaf, subLeaf => {
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
