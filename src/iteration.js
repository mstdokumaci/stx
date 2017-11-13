import { getString } from './cache'
import { getFromLeaves } from './get'

const forEach = (branch, leaf, cb) => {
  const exists = {}
  const oBranch = branch
  const id = leaf.id
  leaf = getFromLeaves(branch, id)
  while (branch) {
    if (leaf && leaf.keys) {
      leaf.keys.forEach(leafId => {
        if (exists[leafId]) {
          return
        }
        exists[leafId] = true
        const subLeaf = leaf.kBranch.leaves[leafId]
        subLeaf.id = leafId
        subLeaf.branch = oBranch
        cb(subLeaf, getString(subLeaf.key))
      })
    }
    branch = branch.inherits
    if (branch) {
      leaf = branch.leaves[id]
    }
  }
}

export { forEach }
