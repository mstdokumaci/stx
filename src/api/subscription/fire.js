import { Leaf } from '../../leaf'

const addParentSubscription = (branch, parent, child, depth, parentList, stamp) => {
  if (branch.subscriptions[parent]) {
    if (branch.subscriptions[parent].stamp === stamp) {
      return
    }

    if (branch.subscriptions[parent].keys) {
      branch.subscriptions[parent].keys.push([child, depth])
    } else {
      branch.subscriptions[parent].keys = [[child, depth]]
      parentList.push(parent)
    }
  } else {
    branch.subscriptions[parent] = { keys: [[child, depth]] }
    parentList.push(parent)
  }
}

const subscriptions = (branch, id, stamp, depth) => {
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

  const parent = branch.leaves[id].parent
  if (parent) {
    if (!branch.parentSubscriptions[depth]) {
      branch.parentSubscriptions[depth] = []
    }
    addParentSubscription(branch, parent, id, 1, branch.parentSubscriptions[depth], stamp)
  }
}

const checkOptions = (options, id, depth) => {
  let pass = true

  if (options.depth) {
    pass &= depth <= options.depth
  }

  if (options.keys) {
    pass &= options.keys.includes(id)
  } else if (options.excludeKeys) {
    pass &= !options.excludeKeys.includes(id)
  }

  return pass
}

const referenceSubscriptions = (branch, ids, stamp, keys, parentList) => {
  ids.forEach(id => {
    if (!branch.subscriptions[id]) {
      branch.subscriptions[id] = {}
    }
    parentSubscriptions(branch, id, stamp, keys, parentList)
  })
}

const parentSubscriptions = (branch, id, stamp, keys, parentList) => {
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
    referenceSubscriptions(branch, branch.rF[id], stamp, keys, parentList)
  }

  const parent = branch.leaves[id].parent
  if (parent) {
    const last = parentList.length - 1
    if (!parentList[last]) {
      parentList[last] = []
    }
    const depth = Math.min(...keys.map(key => key[1]))
    addParentSubscription(branch, parent, id, depth + 1, parentList[last], stamp)
  }
}

const fireParentSubscriptions = (branch, stamp) => {
  const parentList = branch.parentSubscriptions.splice(0)
  while (parentList.length) {
    const nextLevel = parentList.pop()
    if (nextLevel) {
      if (nextLevel.length && !parentList.length) {
        parentList.push([])
      }
      nextLevel.forEach(id => {
        const keys = branch.subscriptions[id].keys
        branch.subscriptions[id].keys = null
        parentSubscriptions(branch, Number(id), stamp, keys, parentList)
      })
    }
  }

  if (branch.branches.length) {
    branch.branches.forEach(branch => fireParentSubscriptions(branch, stamp))
  }
}

export {
  subscriptions,
  fireParentSubscriptions
}
