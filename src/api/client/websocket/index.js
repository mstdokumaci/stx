import { WebSocket } from '@clusterws/cws'

const bindSocketListeners = (socket, close, error, open, message) => {
  socket.on('close', close)
  socket.on('error', error)
  socket.on('open', open)
  socket.on('message', message)
}

export { WebSocket, bindSocketListeners }
