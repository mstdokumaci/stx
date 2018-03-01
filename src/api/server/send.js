import { createStamp } from '../../stamp'
import { children } from '../array'
import { cache, isCached } from './cache'

const sendLeaves = (socket, master, leaf, options) => {
  const { branch, id } = leaf
  if (branch.leaves[id] === null) {
    return
  }

  let { keys, excludeKeys, depth, limit } = options

  if (!depth) {
    depth = Infinity
  }

  keys = keys ? keys.filter(
    key => serializeWithAllChildren(socket, branch, master, key, depth - 1)
  ) : serializeAllChildren(socket, branch, master, id, depth, excludeKeys, limit)

  serializeLeaf(socket, branch, master, id, keys, depth)

  if (socket.external && Object.keys(socket.leaves).length) {
    socket.send(JSON.stringify({ t: createStamp(branch.stamp), l: socket.leaves }))
    socket.leaves = {}
  }
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
  if (socket.leaves[id] || branch.leaves[id] === null || depth < 0) {
    return
  }

  const keys = serializeAllChildren(socket, branch, master, id, depth)
  serializeLeaf(socket, branch, master, id, keys, depth)

  return true
}

const serializeLeaf = (socket, branch, master, id, keys, depth) => {
  const oBranch = branch
  let key, parent, stamp, val, rT, isMaster

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

      if (!key && leaf.key) {
        isMaster = branch === master
        key = leaf.key
        parent = leaf.parent
        stamp = leaf.stamp
      }
    }

    branch = branch.inherits
  }

  if (key && !isCached(socket, isMaster, id, stamp)) {
    socket.leaves[id] = [ key, parent, stamp, val, rT, keys ]
    cache(socket, isMaster, id, stamp)
  }
}

export { sendLeaves }
