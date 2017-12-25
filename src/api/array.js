import { Leaf } from '../index'
import { getString } from '../cache'
import { getFromLeaves } from './get'
import { compute } from './compute'

const children = (oBranch, leaf, cb) => {
  const exists = {}
  let branch = leaf.struct
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

const forEach = (branch, leaf, cb) => {
  children(branch, leaf, subLeaf => {
    cb(new Leaf(branch, subLeaf), getString(subLeaf.key))
  })
}

const map = (branch, leaf, cb) => {
  const mapped = []
  children(branch, leaf, subLeaf => {
    mapped.push(cb(new Leaf(branch, subLeaf), getString(subLeaf.key)))
  })
  return mapped
}

const filter = (branch, leaf, cb) => {
  const filtered = []
  children(branch, leaf, subLeaf => {
    const subLeafInstance = new Leaf(branch, subLeaf)
    if (cb(subLeafInstance, getString(subLeaf.key))) {
      filtered.push(subLeafInstance)
    }
  })
  return filtered
}

const find = (branch, leaf, cb) => {
  const found = children(branch, leaf, subLeaf => {
    return cb(new Leaf(branch, subLeaf), getString(subLeaf.key))
  })
  if (found) {
    return new Leaf(branch, found)
  }
}

const reduce = (branch, leaf, cb, accumulator) => {
  let skipFirst = accumulator === void 0
  children(branch, leaf, subLeaf => {
    if (skipFirst) {
      accumulator = compute(branch, subLeaf.id)
      skipFirst = false
    } else {
      accumulator = cb(accumulator, new Leaf(branch, subLeaf), getString(subLeaf.key))
    }
  })
  return accumulator
}

export { children, forEach, map, filter, find, reduce }
