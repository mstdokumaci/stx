import { getString } from '../../cache'
import { createStamp } from '../../stamp'
import { children } from '../array'
import maxSize from './max-size'
import { getFromLeaves } from '../get'
import {
  cache,
  isCachedForStamp,
  isCached,
  cacheString,
  isStringCached
} from './cache'

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

const sendData = (socket, branch, data) => {
  if (
    socket.external &&
    (
      Object.keys(data.leaves).length ||
      Object.keys(data.strings).length
    )
  ) {
    const json = { t: createStamp(branch.stamp), l: data.leaves, s: data.strings }
    if (Object.keys(socket.cleanLeaves).length) {
      json.c = socket.cleanLeaves
      socket.cleanLeaves = {}
    }
    if (Object.keys(socket.removeLeaves).length) {
      json.r = socket.removeLeaves
      socket.removeLeaves = {}
    }
    send(socket, JSON.stringify(json))
  }
}

const sendLeaves = (socket, master, leaf, options, dataOverride) => {
  const { branch, id } = leaf
  if (branch.leaves[id] === null) {
    return
  }

  let { keys, excludeKeys, depth, limit } = options

  const depthLimit = depth || Infinity
  const data = dataOverride || { leaves: {}, strings: {} }

  serializeParents(data, socket, master, branch, id)

  keys = keys ? keys.filter(
    key => serializeWithAllChildren(data, socket, master, branch, key, depthLimit, 1)
  ) : serializeAllChildren(data, socket, master, branch, id, depthLimit, 0, excludeKeys, limit)

  serializeLeaf(data, socket, master, branch, id, keys, depthLimit, 0)

  if (!dataOverride) {
    sendData(socket, branch, data)
  }
}

const serializeAllChildren = (
  data, socket, master, branch, id, depthLimit, depth, excludeKeys, limit = Infinity
) => {
  const keys = []

  children(branch, id, (_, leafId) => {
    if (excludeKeys && excludeKeys.includes(leafId)) {
      return
    }

    keys.push(leafId)
    serializeWithAllChildren(data, socket, master, branch, leafId, depthLimit, depth + 1)

    if (!--limit) {
      return true
    }
  })

  return keys
}

const serializeWithAllChildren = (data, socket, master, branch, id, depthLimit, depth) => {
  if (data[id] || branch.leaves[id] === null || depthLimit < depth) {
    return
  }

  const keys = serializeAllChildren(data, socket, master, branch, id, depthLimit, depth)
  return serializeLeaf(data, socket, master, branch, id, keys, depthLimit, depth)
}

const serializeParents = (data, socket, master, branch, id) => {
  let parent = getFromLeaves(branch, id).parent
  while (parent) {
    if (!data.leaves[id]) {
      break
    }

    serializeLeaf(data, socket, master, branch, parent, [id], 0, 0)

    id = parent
    parent = getFromLeaves(branch, id).parent
  }
}

const serializeLeaf = (data, socket, master, branch, id, keys, depthLimit, sDepth) => {
  const oBranch = branch
  let key, parent, stamp, val, rT, isMaster, depth

  while (branch) {
    const leaf = branch.leaves[id]
    if (leaf === null) {
      break
    } else if (leaf) {
      if (!stamp && leaf.stamp) {
        isMaster = branch === master
        key = leaf.key
        parent = leaf.parent
        stamp = leaf.stamp
        depth = leaf.depth
      }

      if (val === undefined && !rT) {
        if (leaf.val !== undefined) {
          val = leaf.val
          break
        } else if (leaf.rT) {
          rT = leaf.rT
          serializeWithAllChildren(data, socket, master, oBranch, leaf.rT, depthLimit, sDepth)
          serializeParents(data, socket, master, oBranch, leaf.rT)
          break
        }
      }
    }

    branch = branch.inherits
  }

  if (stamp && (val !== undefined || rT || keys.length)) {
    if (!isCachedForStamp(socket, isMaster, id, stamp)) {
      data.leaves[id] = [key, parent, stamp, val, rT, keys, depth]
      if (socket.cleanLeaves[id]) {
        delete socket.cleanLeaves[id]
      }
      cache(socket, isMaster, id, stamp)

      if (!isStringCached(socket, key)) {
        data.strings[key] = getString(key)
        cacheString(socket, key)
      }
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

export { sendData, sendLeaves, removeLeaves }
