import ua from 'vigour-ua'
import { Server } from 'uws'

import uid from '../../uid'
import { createStamp } from '../../stamp'
import define from '../../define'
import { removeSubscriptions } from './subscriptions'
import { incoming } from './incoming'

const heartBeatTimeout = 8e3

const removeSocket = (server, socketId, socket) => {
  socket.removeAllListeners()
  removeSubscriptions(socket.branch, socketId)
  delete server.sockets[socketId]
}

const serverClose = Server.prototype.close
define(Server.prototype, 'close', function (cb) {
  for (const socketId in this.sockets) {
    this.sockets[socketId].close()
  }
  this.httpServer.close()
  serverClose.call(this, cb)
})

const listen = (branch, port, forceHeartbeat) => {
  const server = new Server({ port })
  server.sockets = {}

  server.on('listening', () => {
    console.log(`💫 listening websockets on ${port} 💫`)

    server.on('connection', socket => {
      const socketId = uid()

      socket.branch = branch
      socket.leaves = {}
      socket.ua = ua(socket.upgradeReq && socket.upgradeReq.headers['user-agent'])
      server.sockets[socketId] = socket

      if (socket.ua.platform === 'ios' || forceHeartbeat) {
        socket.send(JSON.stringify({
          t: createStamp(socket.branch.stamp),
          h: true
        }))

        socket.on('message', data => {
          try {
            data = JSON.parse(data)
            if (!data) return
          } catch (e) {
            return e
          }

          if (data.h) {
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
            incoming(server, socketId, socket, branch, data)
          }
        })
      } else {
        socket.send(JSON.stringify({
          t: createStamp(socket.branch.stamp)
        }))

        socket.on('message', (data) => {
          try {
            data = JSON.parse(data)
            if (!data) return
          } catch (e) {
            return e
          }

          incoming(server, socketId, socket, branch, data)
        })
      }

      socket.on('close', () => removeSocket(server, socketId, socket))

      socket.on('error', () => socket.close())
    })
  })

  return server
}

export { listen }
