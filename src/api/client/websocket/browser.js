import maxSize from '../../server/max-size'
import { concatUint8Arrays } from './utils'

const WebSocket = window.WebSocket
const FileReader = window.FileReader

const bindSocketListeners = (socket, close, error, open, message) => {
  socket.blobArray = []
  socket.onclose = close
  socket.onerror = error
  socket.onopen = open
  socket.onmessage = ({ data }) => {
    if (typeof data === 'string') {
      message(data)
    } else {
      socket.blobArray.push(data)

      if (data.size < maxSize) {
        Promise.all(socket.blobArray.splice(0).map(blob => new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.addEventListener(
            'loadend',
            e => e.error ? reject(e.error) : resolve(new Uint8Array(reader.result)),
            false
          )
          reader.readAsArrayBuffer(blob)
        })))
          .then(uInt8Arrays => message(new TextDecoder('utf8').decode(
            concatUint8Arrays(uInt8Arrays)
          )))
      }
    }
  }
}

export { WebSocket, bindSocketListeners }
