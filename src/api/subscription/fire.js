import { Leaf } from '../..'
import { getFromLeaves } from '../get'

const addParentSubscription = (branch, parent, child, depth) => {
  if (branch.subscriptions[parent]) {
    if (branch.subscriptions[parent].keys) {
      branch.subscriptions[parent].keys.push([ child, depth ])
    } else {
      branch.subscriptions[parent].keys = [ [ child, depth ] ]
      branch.parentSubscriptions.push(parent)
    }
  } else {
    branch.subscriptions[parent] = { keys: [ [ child, depth ] ] }
    branch.parentSubscriptions.push(parent)
  }
}

const subscriptions = (branch, id, stamp) => {
  if (!branch.subscriptions[id]) {
    branch.subscriptions[id] = { stamp }
  } else if (branch.subscriptions[id].stamp === stamp) {
    return
  } else {
    branch.subscriptions[id].stamp = stamp
  }

  if (branch.subscriptions[id].listeners) {
    for (const listenerId in branch.subscriptions[id].listeners) {
      const options = branch.subscriptions[id].listeners[listenerId]
      options.cb(new Leaf(branch, id), options)
    }
  }

  const parent = getFromLeaves(branch, id).parent
  if (parent) {
    addParentSubscription(branch, parent, id, 1)
  }
}

const checkOptions = (options, id, depth) => {
  let pass = true

  if (options.depth) {
    pass &= depth <= options.depth
  }

  if (options.keys) {
    pass &= !!~options.keys.indexOf(id)
  } else if (options.excludeKeys) {
    pass &= !~options.excludeKeys.indexOf(id)
  }

  return pass
}

const referenceSubscriptions = (branch, ids, stamp, keys) => {
  for (const id in ids) {
    if (!branch.subscriptions[id]) {
      branch.subscriptions[id] = {}
    }
    parentSubscriptions(branch, id, stamp, keys)
  }
}

const parentSubscriptions = (branch, id, stamp, keys) => {
  if (branch.subscriptions[id].stamp === stamp) {
    return
  } else {
    branch.subscriptions[id].stamp = stamp
  }

  if (branch.subscriptions[id].listeners) {
    for (const listenerId in branch.subscriptions[id].listeners) {
      const options = branch.subscriptions[id].listeners[listenerId]
      if (keys.find(key => checkOptions(options, key[0], key[1]))) {
        options.cb(new Leaf(branch, id), options)
      }
    }
  }

  if (branch.rF[id]) {
    referenceSubscriptions(branch, branch.rF[id], stamp, keys)
  }

  const parent = getFromLeaves(branch, id).parent
  if (parent) {
    const depth = keys.reduce((depth, key) => depth > key[1] ? key[1] : depth, Infinity)
    addParentSubscription(branch, parent, id, depth + 1)
  }
}

const fireParentSubscriptions = (branch, stamp) => {
  while (branch.parentSubscriptions.length) {
    branch.parentSubscriptions.splice(0).forEach(id => {
      const keys = branch.subscriptions[id].keys.splice(0)
      delete branch.subscriptions[id].keys
      parentSubscriptions(branch, Number(id), stamp, keys)
    })
  }

  if (branch.branches.length) {
    branch.branches.forEach(branch => fireParentSubscriptions(branch, stamp))
  }
}

export {
  subscriptions,
  fireParentSubscriptions
}
