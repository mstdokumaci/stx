const cache = (socket, isMaster, id, stamp) => {
  if (isMaster) {
    delete socket.cache.branch[id]
    socket.cache.master[id] = stamp
  } else {
    delete socket.cache.master[id]
    socket.cache.branch[id] = stamp
  }
}

const isCachedForStamp = (socket, isMaster, id, stamp) => socket.cache &&
  (isMaster ? socket.cache.master[id] === stamp : socket.cache.branch[id] === stamp)

const isCached = (socket, isMaster, id) => socket.cache &&
  (isMaster ? socket.cache.master[id] : socket.cache.branch[id])

const reuseCache = (socket) => {
  if (!socket.cache) return undefined

  return {
    cache: {
      master: socket.cache.master,
      branch: {},
      strings: socket.cache.strings
    },
    remove: socket.cache.branch
  }
}

const cacheString = (socket, id) => {
  socket.cache.strings[id] = true
}

const isStringCached = (socket, id) => socket.cache && socket.cache.strings[id]

export { cache, isCachedForStamp, isCached, reuseCache, cacheString, isStringCached }
