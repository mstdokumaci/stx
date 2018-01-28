import { Leaf } from '../../index'
import { getFromLeaves } from '../get'

const checkOptions = (options, id, depth) => {
  let pass = true

  if (options.depth) {
    pass &= depth <= options.depth
  }

  if (options.keys) {
    pass &= ~options.keys.indexOf(id)
  } else if (options.excludeKeys) {
    pass &= !~options.excludeKeys.indexOf(id)
  }

  return pass
}

const referenceSubscriptions = (branch, ids, stamp, depth) => {
  for (const id in ids) {
    subscriptions(branch, id, stamp)
    referenceSubscriptions(branch, ids[id], stamp, depth)
  }
}

const subscriptions = (branch, id, stamp, depth = 0) => {
  let previousId = id
  while (id) {
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
        if (checkOptions(options, previousId, depth)) {
          options.cb(new Leaf(branch, id), options)
        }
      }
    }

    if (id !== previousId && branch.rF[id]) {
      referenceSubscriptions(branch, branch.rF[id], stamp, depth)
    }

    depth++
    previousId = id
    id = getFromLeaves(branch, id).parent
  }
}

export { subscriptions }
