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

  let { keys, excludeKeys, depth, limit } = options

  if (!depth) {
    depth = Infinity
  }

  const leaves = {}

  keys = keys ? keys.filter(
    key => serializeWithAllChildren(leaves, socket, branch, master, key, depth - 1)
  ) : serializeAllChildren(leaves, socket, branch, master, id, depth, excludeKeys, limit)

  serializeLeaf(leaves, socket, branch, master, id, keys, depth)

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
  leaves, socket, branch, master, id, depth, excludeKeys, limit = Infinity
) => {
  const keys = []

  children(branch, id, (subBranch, leafId) => {
    if (excludeKeys && ~excludeKeys.indexOf(leafId)) {
      return
    }

    keys.push(leafId)
    serializeWithAllChildren(leaves, socket, branch, master, leafId, depth - 1)

    if (!--limit) {
      return true
    }
  })

  return keys
}

const serializeWithAllChildren = (leaves, socket, branch, master, id, depth) => {
  if (leaves[id] || branch.leaves[id] === null || depth < 0) {
    return
  }

  const keys = serializeAllChildren(leaves, socket, branch, master, id, depth)
  return serializeLeaf(leaves, socket, branch, master, id, keys, depth)
}

const serializeLeaf = (leaves, socket, branch, master, id, keys, depth) => {
  const oBranch = branch
  let key, parent, stamp, val, rT, isMaster

  while (branch) {
    const leaf = branch.leaves[id]
    if (leaf === null) {
      break
    } else if (leaf) {
      if (!val && !rT) {
        if (leaf.val !== void 0) {
          val = leaf.val
        } else if (leaf.rT) {
          rT = leaf.rT
          serializeWithAllChildren(socket, oBranch, master, leaf.rT, depth)
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
      leaves[id] = [ key, parent, stamp, val, rT, keys ]
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
