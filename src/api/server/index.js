import { App, us_listen_socket_close as closeListen } from 'uWebSockets.js'

import uid from '../../uid'
import { createStamp } from '../../stamp'
import define from '../../define'
import {
  addAllDataListener,
  removeSubscriptionsAndAllDataListener
} from './subscriptions'
import { incoming } from './incoming'
import maxSize from './max-size'

const removeSocket = (server, socket) => {
  removeSubscriptionsAndAllDataListener(socket.branch, socket.id)
  delete server.sockets[socket.id]
}

const Server = function () {
  this.sockets = {}
}

define(Server.prototype, 'close', function (cb) {
  if (this.listen) {
    for (const id in this.sockets) {
      this.sockets[id].end()
    }

    closeListen(this.listen)
    this.listen = null

    if (cb) {
      cb()
    }
  }
})

const listen = (branch, port) => {
  const server = new Server()

  App({

  }).ws('/*', {
    maxPayloadLength: maxSize,
    idleTimeout: 10,
    compression: 1,
    open: (socket) => {
      socket.id = uid()
      socket.branch = branch
      socket.cleanLeaves = {}
      socket.removeLeaves = {}
      socket.incoming = null
      server.sockets[socket.id] = socket
      addAllDataListener(branch, socket)

      socket.send(new TextEncoder('utf-8').encode(JSON.stringify({
        t: createStamp(socket.branch.stamp)
      })))
    },
    message: (socket, data) => {
      try {
        data = JSON.parse(new TextDecoder('utf-8').decode(data))
        if (!data) return
      } catch (e) {
        return e
      }

      incoming(server, socket, branch, data)
    },
    close: (socket) => server && removeSocket(server, socket)
  }).any('/*', res => {
    res.end('Nothing to see here!')
  }).listen(port, listenSocket => {
    if (listenSocket) {
      console.log(`💫 listening websockets on ${port} 💫`)
      server.listen = listenSocket
    } else {
      throw Error(`Could not listen on ${port}`)
    }
  })

  return server
}

export { listen }
