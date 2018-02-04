import ua from 'vigour-ua'
import { Server } from 'uws'

import uid from '../../uid'
import { createStamp } from '../../stamp'
import { incoming } from './incoming'

const heartBeatTimeout = 8e3

const removeSubscriptions = (branch, socketId) => {
  for (const id in branch.subscriptions) {
    for (const listenerId in branch.subscriptions[id].listeners) {
      if (listenerId.indexOf(socketId) === 0) {
        delete branch.subscriptions[id].listeners[listenerId]
      }
    }
  }
}

const removeSocket = (server, socketId, socket) => {
  socket.removeAllListeners()
  removeSubscriptions(socket.branch, socketId)
  delete server.sockets[socketId]
}

const listen = (branch, port) => {
  const server = new Server({ port })
  server.sockets = {}

  console.log(`💫 listening websockets on ${port} 💫`)

  server.on('connection', socket => {
    const socketId = uid()

    socket.branch = branch
    socket.ua = ua(socket.upgradeReq && socket.upgradeReq.headers['user-agent'])
    server.sockets[socketId] = socket

    if (socket.ua.platform === 'ios') {
      socket.send(JSON.stringify([void 0, {
        stamp: createStamp(),
        connect: true,
        heartbeat: true
      }]))

      socket.on('message', data => {
        try {
          data = JSON.parse(data)
          if (!data) return
        } catch (e) {
          return e
        }

        if (data[1] && data[1].heartbeat) {
          clearTimeout(socket.heartBeatTimeout)
          socket.heartBeatTimeout = setTimeout(() => {
            if (socket.external) {
              socket.close()
            } else {
              removeSocket(server, socketId, socket)
            }
            socket.heartBeatTimeout = null
          }, heartBeatTimeout)
        } else {
          incoming(server, socketId, branch, data)
        }
      })
    } else {
      socket.send(JSON.stringify([void 0, {
        stamp: createStamp(),
        connect: true
      }]))

      socket.on('message', (data) => {
        try {
          data = JSON.parse(data)
          if (!data) return
        } catch (e) {
          return e
        }

        incoming(server, socketId, branch, data)
      })
    }

    socket.on('close', () => removeSocket(server, socketId, socket))

    socket.on('error', () => socket.close())
  })

  return server
}

export { listen }
