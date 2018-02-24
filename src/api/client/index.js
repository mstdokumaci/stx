import maxSize from '../server/maxSize'

import WebSocket from './websocket'
import { incoming } from './incoming'
import define from '../../define'

const isNode = typeof window === 'undefined'
let blobArray = false

const receiveLarge = data => new Promise(resolve => {
  if (!blobArray) blobArray = []
  blobArray.push(data)

  if (data.size < maxSize) {
    let i = blobArray.length
    let done = i
    let stringArray = []

    while (i--) {
      const reader = new FileReader() // eslint-disable-line

      const onLoadEnd = ((i, e) => {
        reader.removeEventListener('loadend', onLoadEnd, false)
        if (!e.error) {
          stringArray[i] = reader.result
          if (--done === 0) resolve(stringArray.join(''))
        }
      }).bind(null, i)

      reader.addEventListener('loadend', onLoadEnd, false)
      reader.readAsText(blobArray[i])
    }

    blobArray = false
  } else {
    resolve()
  }
})

const socketClose = WebSocket.prototype.close
define(WebSocket.prototype, 'close', function (code, data) {
  this.blockReconnect = true
  socketClose.call(this, code, data)
})

const connect = (branch, url, reconnect = 50) => {
  const socket = new WebSocket(url)

  const close = () => {
    if (socket.heartbeat) {
      clearTimeout(socket.heartbeat)
      socket.heartbeat = null
    }
    branch.client.connected = false
    if (!socket.blockReconnect) {
      reconnect = Math.min((reconnect * 1.5), 2000)
      branch.client.reconnect = setTimeout(connect, reconnect, branch, url, reconnect)
    }
  }

  socket.onclose = close

  socket.onerror = isNode ? close : socket.close.bind(socket)

  socket.onopen = () => {
    branch.client.socket = socket
  }

  socket.onmessage = ({ data }) => {
    (
      (
        typeof data !== 'string' &&
        (
          data instanceof ArrayBuffer ||
          (
            !isNode &&
            (
              (('Blob' in global) && data instanceof Blob) || // eslint-disable-line
              (('WebkitBlob' in global) && data instanceof WebkitBlob) // eslint-disable-line
            )
          )
        )
      ) ? receiveLarge(data) : Promise.resolve(data)
    )
      .then(data => {
        if (data) {
          try {
            data = JSON.parse(data)
            if (!data) return
          } catch (e) {
            return e
          }

          incoming(branch, data)
        }
      })
  }

  return socket
}

export { connect }
