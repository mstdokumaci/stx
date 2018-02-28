const cache = (socket, isMaster, id, stamp) => {
  if (!socket.cache) socket.cache = { master: {}, branch: {} }

  if (isMaster) {
    delete socket.cache.branch[id]
    socket.cache.master[id] = stamp
  } else {
    delete socket.cache.master[id]
    socket.cache.branch[id] = stamp
  }
}

const isCached = (socket, isMaster, id, stamp) => socket.cache &&
  (isMaster ? socket.cache.master[id] === stamp : socket.cache.branch[id] === stamp)

const reuseCache = (socket) => {
  if (!socket.cache) return void 0

  return {
    cache: {
      master: socket.cache.master,
      branch: {}
    },
    remove: socket.cache.branch
  }
}

export { cache, isCached, reuseCache }
