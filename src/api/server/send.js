import { children } from '../array'
import { cache, isCached } from './cache'

const queueLeaves = (
  socket, branch, master, id, keys, excludeKeys, depth = Infinity, limit
) => {
  if (branch.leaves[id] === null) {
    return
  }

  let keyList

  if (keys) {
    keyList = keys.filter(
      key => serializeWithAllChildren(socket, branch, master, key, depth - 1)
    )
  } else {
    keyList = serializeAllChildren(socket, branch, master, id, depth, excludeKeys, limit)
  }

  serializeLeaf(socket, branch, master, id, keyList, depth)

  drainQueue(socket)
}

const serializeAllChildren = (
  socket, branch, master, id, depth, excludeKeys, limit = Infinity
) => {
  const keys = []

  children(branch, id, (subBranch, leafId) => {
    if (excludeKeys && ~excludeKeys.indexOf(leafId)) {
      return
    }

    keys.push(leafId)
    serializeWithAllChildren(socket, branch, master, leafId, depth - 1)

    if (!--limit) {
      return true
    }
  })

  return keys
}

const serializeWithAllChildren = (socket, branch, master, id, depth) => {
  if (socket.queue.l[id] || branch.leaves[id] === null || depth < 0) {
    return
  }

  serializeLeaf(
    socket,
    branch,
    master,
    id,
    serializeAllChildren(socket, branch, master, id, depth),
    depth
  )

  return true
}

const serializeLeaf = (socket, branch, master, id, keys, depth) => {
  const oBranch = branch
  let key, parent, stamp, val, rT

  while (branch) {
    const leaf = branch.leaves[id]
    if (leaf === null) {
      break
    } else if (leaf) {
      if (!val && !rT) {
        if (leaf.val) {
          val = leaf.val
        } else if (leaf.rT) {
          rT = leaf.rT
          serializeWithAllChildren(socket, oBranch, master, leaf.rT, depth)
        }
      }

      if (leaf.stamp > stamp) {
        stamp = leaf.stamp
      }

      if (!key && leaf.key) {
        key = leaf.key
        if (leaf.parent) {
          parent = leaf.parent
        }
      }
    }

    branch = branch.inherits
  }

  const isMaster = oBranch === master

  if (key && isCached(socket, isMaster, id, stamp)) {
    socket.queue.l[id] = [ key, parent, stamp, val, rT, keys ]
    cache(socket, isMaster, id, stamp)
  }
}

const drainQueue = socket => {
  if (socket.external && Object.keys(socket.queue.l).length) {
    socket.send(JSON.stringify(socket.queue))
    socket.queue = { l: {} }
  }
}

export { queueLeaves, drainQueue }
