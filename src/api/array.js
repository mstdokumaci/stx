import { Leaf } from '../leaf'
import { getString } from '../cache'
import { compute } from './compute'

const forEach = (branch, id, cb) => {
  branch.leaves[id].keys.forEach(key => {
    if (branch.leaves[key] !== null) {
      cb(new Leaf(branch, key), getString(branch.leaves[key].key))
    }
  })
}

const map = (branch, id, cb) => {
  const mapped = []
  branch.leaves[id].keys.forEach(key => {
    if (branch.leaves[key] !== null) {
      mapped.push(cb(new Leaf(branch, key), getString(branch.leaves[key].key)))
    }
  })
  return mapped
}

const filter = (branch, id, cb) => {
  const filtered = []
  branch.leaves[id].keys.forEach(key => {
    if (branch.leaves[key] !== null) {
      const subLeafInstance = new Leaf(branch, key)
      if (cb(subLeafInstance, getString(branch.leaves[key].key))) {
        filtered.push(subLeafInstance)
      }
    }
  })
  return filtered
}

const find = (branch, id, cb) => {
  for (const key of branch.leaves[id].keys) {
    if (branch.leaves[key] !== null) {
      const subLeafInstance = new Leaf(branch, key)
      if (cb(subLeafInstance, getString(branch.leaves[key].key))) {
        return subLeafInstance
      }
    }
  }
}

const reduce = (branch, id, cb, accumulator) => {
  let skipFirst = accumulator === undefined
  branch.leaves[id].keys.forEach(key => {
    const leaf = branch.leaves[key]
    if (leaf !== null) {
      if (skipFirst) {
        accumulator = compute(branch, leaf)
        skipFirst = null
      } else {
        accumulator = cb(accumulator, new Leaf(branch, key), getString(leaf.key))
      }
    }
  })
  return accumulator
}

export { forEach, map, filter, find, reduce }
