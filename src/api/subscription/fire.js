import { Leaf } from '../..'
import { getFromLeaves } from '../get'

const createParentSubscriptions = (branch, stamp) => {
  branch.parentSubscriptions[stamp] = {}

  if (branch.branches.length) {
    branch.branches.forEach(branch => createParentSubscriptions(branch, stamp))
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
    subscriptions(branch, id, stamp, keys)
    referenceSubscriptions(branch, ids[id], stamp, keys)
  }
}

const subscriptions = (branch, id, stamp, keys) => {
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
      if (!keys || keys.find(key => checkOptions(options, key[0], key[1]))) {
        options.cb(new Leaf(branch, id), options)
      }
    }
  }

  if (keys && branch.rF[id]) {
    referenceSubscriptions(branch, branch.rF[id], stamp, keys)
  }

  const parent = getFromLeaves(branch, id).parent
  if (parent) {
    const depth = keys
      ? keys.reduce((depth, key) => depth > key[1] ? key[1] : depth, Infinity)
      : 0

    if (branch.parentSubscriptions[stamp][parent]) {
      branch.parentSubscriptions[stamp][parent].push([ id, depth + 1 ])
    } else {
      branch.parentSubscriptions[stamp][parent] = [ [ id, depth + 1 ] ]
    }
  }
}

const fireParentSubscriptions = (branch, stamp) => {
  let fired = true
  while (fired) {
    fired = false
    const parentSubscriptionsToRun = JSON.parse(JSON.stringify(branch.parentSubscriptions[stamp]))
    branch.parentSubscriptions[stamp] = {}
    for (const id in parentSubscriptionsToRun) {
      fired = true
      subscriptions(branch, Number(id), stamp, parentSubscriptionsToRun[id])
    }
  }
  delete branch.parentSubscriptions[stamp]

  if (branch.branches.length) {
    branch.branches.forEach(branch => fireParentSubscriptions(branch, stamp))
  }
}

export {
  createParentSubscriptions,
  subscriptions,
  fireParentSubscriptions
}
