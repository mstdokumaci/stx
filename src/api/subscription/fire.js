import { Leaf } from '../../index'
import { getFromLeaves } from '../get'

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
        branch.subscriptions[id].listeners[listenerId].cb(
          new Leaf(branch, id),
          branch.subscriptions[id].listeners[listenerId]
        )
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
