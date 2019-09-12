import { getString } from '../../cache'
import { createStamp } from '../../stamp'
import { getByPath } from '../get'
import { compute } from '../compute'
import maxSize from './max-size'
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

const sendLeaves = (socket, leaf, options, dataOverride) => {
  const { branch, id } = leaf
  if (branch.leaves[id] === null) {
    return
  }

  let { keys, excludeKeys, depth, sort, limit } = options

  const depthLimit = depth || Infinity
  const data = dataOverride || { leaves: {}, strings: {} }

  serializeParents(data, socket, branch, Number(id))

  keys = keys ? keys.filter(
    key => serializeWithAllChildren(data, socket, branch, key, depthLimit, 1)
  ) : serializeAllChildren(data, socket, branch, id, depthLimit, 0, excludeKeys, sort, limit || Infinity)

  serializeLeaf(data, socket, branch, id, keys, depthLimit, 0)

  if (!dataOverride) {
    sendData(socket, branch, data)
  }
}

const serializeAllChildren = (
  data, socket, branch, id, depthLimit, depth, excludeKeys, sort, limit = Infinity
) => {
  const keys = []
  let originalKeys = branch.leaves[id].keys

  if (sort && sort.path) {
    originalKeys = [...originalKeys].sort((key1, key2) => {
      const leaf1 = branch.leaves[getByPath(branch, key1, sort.path)]
      const leaf2 = branch.leaves[getByPath(branch, key2, sort.path)]
      if (sort.type === 'N') {
        const result = (leaf1 && compute(branch, leaf1)) - (leaf2 && compute(branch, leaf2))
        return sort.desc ? result * -1 : result
      } else if (sort.type === 'S') {
        const result = String(leaf1 && compute(branch, leaf1))
          .localeCompare(String(leaf2 && compute(branch, leaf2)))
        return sort.desc ? result * -1 : result
      }
    })
  }

  for (const leafId of originalKeys) {
    if (
      branch.leaves[leafId] === null ||
      (
        excludeKeys &&
        excludeKeys.includes(leafId)
      )
    ) {
      continue
    }

    if (serializeWithAllChildren(data, socket, branch, leafId, depthLimit, depth + 1)) {
      keys.push(leafId)
    }

    if (!--limit) {
      break
    }
  }

  return keys
}

const serializeWithAllChildren = (data, socket, branch, id, depthLimit, depth) => {
  if (!(id in branch.leaves) || branch.leaves[id] === null || depthLimit < depth) {
    return
  }

  const keys = serializeAllChildren(data, socket, branch, id, depthLimit, depth)
  return serializeLeaf(data, socket, branch, id, keys, depthLimit, depth)
}

const serializeParents = (data, socket, branch, id) => {
  let parent = branch.leaves[id].parent
  while (parent) {
    if (!serializeLeaf(data, socket, branch, parent, [id], -1, -1)) {
      break
    }

    id = parent
    parent = branch.leaves[id].parent
  }
}

const serializeLeaf = (data, socket, branch, id, keys, depthLimit, depth) => {
  const leaf = branch.leaves[id]
  const isMaster = !Object.prototype.hasOwnProperty.call(branch.leaves, id)

  if (
    leaf !== null &&
    (
      leaf.val !== undefined ||
      keys.length ||
      (
        Object.prototype.hasOwnProperty.call(branch.leaves, id) &&
        Object.prototype.hasOwnProperty.call(leaf, 'keys')
      )
    )
  ) {
    if (leaf.rT && depth > -1) {
      serializeWithAllChildren(data, socket, branch, leaf.val, depthLimit, depth)
      serializeParents(data, socket, branch, leaf.val)
    }

    if (depth === 0 || !isCachedForStamp(socket, isMaster, id, leaf.stamp)) {
      data.leaves[id] = [leaf.key, leaf.parent, leaf.stamp, leaf.val, leaf.rT, keys, leaf.depth]
      if (socket.cleanLeaves[id]) {
        delete socket.cleanLeaves[id]
      }
      cache(socket, isMaster, id, leaf.stamp)

      if (!isStringCached(socket, leaf.key)) {
        data.strings[leaf.key] = getString(leaf.key)
        cacheString(socket, leaf.key)
      }

      return true
    }
  }
}

const removeLeaves = (socket, type, stamp, leaf) => {
  if (type === 'remove') {
    const { branch, id } = leaf
    if (isCached(socket, !Object.prototype.hasOwnProperty.call(branch.leaves, id), id)) {
      socket.removeLeaves[id] = stamp
    }
  }
}

export { sendData, sendLeaves, removeLeaves }
