import { getString } from '../../cache'
import { createStamp } from '../../stamp'
import maxSize from './max-size'
import {
  numberSortAsc,
  numberSortDesc,
  stringSortAsc,
  stringSortDesc
} from './sort'
import {
  cache,
  isCachedForStamp,
  isCached,
  cacheString,
  isStringCached
} from './cache'

const sendToSocket = (socket, payload, next) => {
  socket.send(payload, true)
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
    socket.send(new TextEncoder('utf-8').encode(raw))
  }
}

const sendData = (socket, branch, data) => {
  if (
    Object.keys(data.leaves).length ||
    Object.keys(data.strings).length
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
  const data = dataOverride || { leaves: {}, strings: {}, rTs: new Set(), visited: new Set() }

  serializeParents(data, socket, branch, Number(id))

  keys = keys ? keys.filter(
    key => serializeWithAllChildren(data, socket, branch, key, depthLimit, 1)
  ) : serializeAllChildren(data, socket, branch, id, depthLimit, 0, excludeKeys, sort, limit || Infinity)

  serializeLeaf(data, socket, branch, id, keys, 0)

  while (data.rTs.size) {
    const rTs = data.rTs
    data.rTs = new Set()
    rTs.forEach(([rT, depth]) => {
      serializeParents(data, socket, branch, rT)
      serializeWithAllChildren(data, socket, branch, rT, depthLimit, depth)
    })
  }

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
    const sortFunction = sort.type === 'N'
      ? sort.desc ? numberSortDesc : numberSortAsc
      : sort.desc ? stringSortDesc : stringSortAsc
    originalKeys = [...originalKeys].sort(sortFunction(branch, sort.path))
  }

  for (const key of originalKeys) {
    if (
      branch.leaves[key] === null ||
      (
        excludeKeys &&
        excludeKeys.includes(key)
      )
    ) {
      continue
    }

    if (serializeWithAllChildren(data, socket, branch, key, depthLimit, depth + 1) || depth === 0) {
      keys.push(key)
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
  return serializeLeaf(data, socket, branch, id, keys, depth)
}

const serializeParents = (data, socket, branch, id) => {
  let parent = branch.leaves[id].parent
  while (parent) {
    if (data.leaves[parent]) {
      data.leaves[parent][5].push(id)
      break
    }

    if (!serializeLeaf(data, socket, branch, parent, [id], -1)) {
      break
    }

    id = parent
    parent = branch.leaves[id].parent
  }
}

const serializeLeaf = (data, socket, branch, id, keys, depth) => {
  const leaf = branch.leaves[id]
  const isMaster = !Object.prototype.hasOwnProperty.call(branch.leaves, id)

  if (leaf !== null) {
    if (leaf.rT && depth !== -1 && !data.visited.has(leaf.val)) {
      data.rTs.add([leaf.val, depth])
    }

    if (
      (depth === 0 && keys.length) ||
      !isCachedForStamp(socket, isMaster, id, leaf.stamp)
    ) {
      if (id in data.leaves) {
        keys.push(...data.leaves[id][5])
      }

      data.leaves[id] = [leaf.key, leaf.parent, leaf.stamp, leaf.val, leaf.rT, keys, leaf.depth]
      cache(socket, isMaster, id, leaf.stamp)

      if (socket.cleanLeaves[id]) {
        delete socket.cleanLeaves[id]
      }

      if (leaf.key !== undefined && !isStringCached(socket, leaf.key)) {
        cacheString(socket, leaf.key)
        data.strings[leaf.key] = getString(leaf.key)
      }

      return true
    }
  }

  data.visited.add(id)
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
