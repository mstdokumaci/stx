import { createStamp } from '../../stamp'
import { children } from '../array'
import { cache, isCachedForStamp, isCached } from './cache'
import maxSize from './maxSize'

const sendToSocket = (socket, payload, next) => {
  socket.send(payload)
  setImmediate(next)
}

const sendLarge = (socket, raw, size) => {
  const count = size / maxSize
  if ((count | 0) === count) {
    raw += ' '
  }

  if (!socket.blobInProgress) {
    socket.blobInProgress = []
  }

  console.log('📡 exceeds frame limit - split up', (size / (1024 * 1024)) | 0, 'MB')
  const buf = Buffer.from(raw, 'utf8')
  let i = 0

  const drainInProgress = done => {
    if (socket.blobInProgress.length > 0) {
      sendToSocket(socket, socket.blobInProgress.shift(), () => drainInProgress(done))
    } else {
      done()
    }
  }

  const next = () => {
    i++
    if (i * maxSize <= size) {
      sendToSocket(socket, buf.slice(i * maxSize, (i + 1) * maxSize), next)
    } else {
      drainInProgress(() => {
        socket.blobInProgress = null
      })
    }
  }

  sendToSocket(socket, buf.slice(i * maxSize, (i + 1) * maxSize), next)
}

const send = (socket, raw) => {
  const size = Buffer.byteLength(raw, 'utf8')
  if (size > maxSize) {
    sendLarge(socket, raw, size)
  } else if (socket.blobInProgress) {
    socket.blobInProgress.push(raw)
  } else {
    socket.send(raw)
  }
}

const sendLeaves = (socket, master, leaf, options) => {
  const { branch, id } = leaf
  if (branch.leaves[id] === null) {
    return
  }

  let { keys, excludeKeys, depthLimit, limit } = options

  if (!depthLimit) {
    depthLimit = Infinity
  }

  const leaves = {}

  keys = keys ? keys.filter(
    key => serializeWithAllChildren(leaves, socket, master, branch, key, depthLimit, 1)
  ) : serializeAllChildren(leaves, socket, master, branch, id, depthLimit, 0, excludeKeys, limit)

  serializeLeaf(leaves, socket, master, branch, id, keys, depthLimit, 0)

  if (socket.external && Object.keys(leaves).length) {
    const json = { t: createStamp(branch.stamp), l: leaves }
    if (Object.keys(socket.removeLeaves).length) {
      json.r = socket.removeLeaves
      socket.removeLeaves = {}
    }
    send(socket, JSON.stringify(json))
  }
}

const serializeAllChildren = (
  leaves, socket, master, branch, id, depthLimit, depth, excludeKeys, limit = Infinity
) => {
  const keys = []

  children(branch, id, (subBranch, leafId) => {
    if (excludeKeys && ~excludeKeys.indexOf(leafId)) {
      return
    }

    keys.push(leafId)
    serializeWithAllChildren(leaves, socket, master, branch, leafId, depthLimit, depth + 1)

    if (!--limit) {
      return true
    }
  })

  return keys
}

const serializeWithAllChildren = (leaves, socket, master, branch, id, depthLimit, depth) => {
  if (leaves[id] || branch.leaves[id] === null || depthLimit < depth) {
    return
  }

  const keys = serializeAllChildren(leaves, socket, master, branch, id, depthLimit, depth)
  return serializeLeaf(leaves, socket, master, branch, id, keys, depthLimit, depth)
}

const serializeLeaf = (leaves, socket, master, branch, id, keys, depthLimit, depth) => {
  const oBranch = branch
  let key, parent, stamp, val, rT, isMaster

  while (branch) {
    const leaf = branch.leaves[id]
    if (leaf === null) {
      break
    } else if (leaf) {
      if (val === void 0 && !rT) {
        if (leaf.val !== void 0) {
          val = leaf.val
        } else if (leaf.rT) {
          rT = leaf.rT
          serializeWithAllChildren(leaves, socket, master, oBranch, leaf.rT, depthLimit, depth)
        }
      }

      if (!stamp && leaf.stamp) {
        isMaster = branch === master
        key = leaf.key
        parent = leaf.parent
        stamp = leaf.stamp
      }
    }

    branch = branch.inherits
  }

  if (stamp && (val !== void 0 || rT || keys.length)) {
    if (!isCachedForStamp(socket, isMaster, id, stamp)) {
      leaves[id] = [ key, parent, stamp, val, rT, keys, depth ]
      cache(socket, isMaster, id, stamp)
    }

    return true
  }
}

const removeLeaves = (socket, master, type, stamp, leaf) => {
  if (type === 'remove') {
    const { branch, id } = leaf
    if (isCached(socket, branch === master, id)) {
      socket.removeLeaves[id] = stamp
    }
  }
}

export { sendLeaves, removeLeaves }
