import { children } from '../array'

const queueLeaves = (
  socket, branch, isMaster, id, keys, excludeKeys, depth = Infinity, limit
) => {
  if (branch.leaves[id] === null) {
    return
  }

  let keyList

  if (keys) {
    keyList = keys.filter(
      key => serializeWithAllChildren(socket, branch, key, depth - 1)
    )
  } else {
    keyList = serializeAllChildren(socket, branch, id, depth, excludeKeys, limit)
  }

  serializeLeaf(socket, branch, id, keyList, depth)
}

const serializeAllChildren = (
  socket, branch, id, depth, excludeKeys, limit = Infinity
) => {
  const keys = []

  children(branch, id, (subBranch, leafId) => {
    if (excludeKeys && ~excludeKeys.indexOf(leafId)) {
      return
    }

    keys.push(leafId)
    serializeWithAllChildren(socket, branch, leafId, depth)

    if (!--limit) {
      return true
    }
  })

  return keys
}

const serializeWithAllChildren = (socket, branch, id, depth) => {
  if (socket.queue.l[id] || branch.leaves[id] === null || depth < 0) {
    return
  }

  serializeLeaf(
    socket, branch, id, serializeAllChildren(socket, branch, id, depth), depth
  )

  return true
}

const serializeLeaf = (socket, branch, id, keys, depth) => {
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
          serializeWithAllChildren(socket, oBranch, leaf.rT, depth)
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

  if (key) {
    socket.queue.l[id] = [ key, parent, stamp, val, rT, keys ]
  }
}

export { queueLeaves }
