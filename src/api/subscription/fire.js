import { Leaf } from '../../index'
import { getFromLeaves } from '../get'

const checkOptions = (options, id, depth) => {
  let pass = true
  if (options.depth) {
    pass &= depth >= options.depth
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
  const oId = id
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
        if (checkOptions(options, id, depth)) {
          options.cb(new Leaf(branch, id), options)
        }
      }
    }

    if (id !== oId && branch.rF[id]) {
      referenceSubscriptions(branch, branch.rF[id], stamp, depth)
    }

    id = getFromLeaves(branch, id).parent
    depth++
  }
}

export { subscriptions }
