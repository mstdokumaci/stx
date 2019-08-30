import { Leaf } from '../leaf'
import { getString } from '../cache'
import { compute } from './compute'

const forEach = (branch, id, cb) => {
  for (const key in branch.leaves[id].keys) {
    if (branch.leaves[key] !== null) {
      cb(new Leaf(branch, key), getString(branch.leaves[key].key))
    }
  }
}

const map = (branch, id, cb) => {
  const mapped = []
  for (const key in branch.leaves[id].keys) {
    if (branch.leaves[key] !== null) {
      mapped.push(cb(new Leaf(branch, key), getString(branch.leaves[key].key)))
    }
  }
  return mapped
}

const filter = (branch, id, cb) => {
  const filtered = []
  for (const key in branch.leaves[id].keys) {
    if (branch.leaves[key] !== null) {
      const subLeafInstance = new Leaf(branch, key)
      if (cb(subLeafInstance, getString(branch.leaves[key].key))) {
        filtered.push(subLeafInstance)
      }
    }
  }
  return filtered
}

const find = (branch, id, cb) => {
  for (const key in branch.leaves[id].keys) {
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
  for (const key in branch.leaves[id].keys) {
    if (branch.leaves[key] !== null) {
      if (skipFirst) {
        accumulator = compute(branch, key)
        skipFirst = null
      } else {
        accumulator = cb(accumulator, new Leaf(branch, key), getString(branch.leaves[key].key))
      }
    }
  }
  return accumulator
}

export { forEach, map, filter, find, reduce }
