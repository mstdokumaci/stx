import { w3cwebsocket } from 'websocket'

import maxSize from '../../server/max-size'
import { concatUint8Arrays } from './utils'

const bindSocketListeners = (socket, close, error, open, message) => {
  socket.uInt8Arrays = []
  socket.onclose = close
  socket.onerror = error
  socket.onopen = open
  socket.onmessage = ({ data }) => {
    if (typeof data === 'string') {
      message(data)
    } else {
      socket.uInt8Arrays.push(new Uint8Array(data))

      if (data.byteLength < maxSize) {
        message(Buffer.from(
          concatUint8Arrays(socket.uInt8Arrays.splice(0))
        ).toString('utf8'))
      }
    }
  }
}

class WebSocket extends w3cwebsocket {
  constructor (url) {
    super(url, null, null, null, null, {
      maxReceivedFrameSize: maxSize,
      maxReceivedMessageSize: maxSize
    })
  }
}

export { WebSocket, bindSocketListeners }
