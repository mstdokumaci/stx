import { Leaf } from '../leaf'
import { getString } from '../cache'
import { compute } from './compute'

const children = (branch, id, cb) => {
  const keys = []
  let found
  for (const key in branch.leaves[id].keys) {
    if (branch.leaves[key] !== null) {
      if (cb) {
        if (cb(key)) {
          found = key
          break
        }
      } else {
        keys.push(key)
      }
    }
  }
  if (found) {
    return found
  } else {
    return keys
  }
}

const forEach = (branch, id, cb) => {
  children(branch, id, id => {
    cb(new Leaf(branch, id), getString(branch.leaves[id].key))
  })
}

const map = (branch, id, cb) => {
  const mapped = []
  children(branch, id, id => {
    mapped.push(cb(new Leaf(branch, id), getString(branch.leaves[id].key)))
  })
  return mapped
}

const filter = (branch, id, cb) => {
  const filtered = []
  children(branch, id, id => {
    const subLeafInstance = new Leaf(branch, id)
    if (cb(subLeafInstance, getString(branch.leaves[id].key))) {
      filtered.push(subLeafInstance)
    }
  })
  return filtered
}

const find = (branch, id, cb) => {
  const found = children(branch, id, id => {
    return cb(new Leaf(branch, id), getString(branch.leaves[id].key))
  })
  if (!Array.isArray(found)) {
    return new Leaf(branch, found)
  }
}

const reduce = (branch, id, cb, accumulator) => {
  let skipFirst = accumulator === undefined
  children(branch, id, id => {
    if (skipFirst) {
      accumulator = compute(branch, id)
      skipFirst = false
    } else {
      accumulator = cb(accumulator, new Leaf(branch, id), getString(branch.leaves[id].key))
    }
  })
  return accumulator
}

export { children, forEach, map, filter, find, reduce }
