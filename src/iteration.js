import { getString } from './cache'
import { getFromLeaves } from './get'

const children = (branch, leaf, cb) => {
  const exists = {}
  const id = leaf.id
  leaf = getFromLeaves(branch, id)
  const subLeaves = []
  while (branch) {
    if (leaf && leaf.keys) {
      leaf.keys.forEach(leafId => {
        if (exists[leafId]) {
          return
        }
        exists[leafId] = true
        if (cb) {
          if (cb(leaf.kBranch.leaves[leafId])) {
            return void 0
          }
        } else {
          subLeaves.push(leaf.kBranch.leaves[leafId])
        }
      })
    }
    branch = branch.inherits
    if (branch) {
      leaf = branch.leaves[id]
    }
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

export { children, forEach, map, filter }
