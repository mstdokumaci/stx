import { Leaf } from '../../index'
import { getFromLeaves } from '../get'

const referenceSubscriptions = (branch, ids, stamp) => {
  for (const id in ids) {
    subscriptions(branch, id, stamp)
    referenceSubscriptions(branch, ids[id], stamp)
  }
}

const subscriptions = (branch, id, stamp) => {
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
        branch.subscriptions[id].listeners[listenerId](new Leaf(branch, id))
      }
    }

    if (id !== oId && branch.rF[id]) {
      referenceSubscriptions(branch, branch.rF[id], stamp)
    }

    id = getFromLeaves(branch, id).parent
  }
}

export { subscriptions }
