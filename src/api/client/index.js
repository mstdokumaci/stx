import { root } from '../../id'
import { createStamp } from '../../stamp'
import define from '../../define'
import { emit } from '../listeners/emit'
import receiveLarge from './receiveLarge'
import WebSocket from './websocket'
import { incoming } from './incoming'

const isNode = typeof window === 'undefined'

const socketClose = WebSocket.prototype.close
define(WebSocket.prototype, 'close', function (code, data) {
  this.blockReconnect = true
  socketClose.call(this, code, data)
})

const connect = (branch, url, reconnect = 50) => {
  if (branch.client.reconnect) {
    clearTimeout(branch.client.reconnect)
    branch.client.reconnect = null
  } else if (branch.client.socket) {
    throw Error('Can not connect twice')
  }

  const socket = new WebSocket(url)

  const onClose = () => {
    if (socket.heartbeat) {
      clearTimeout(socket.heartbeat)
      socket.heartbeat = null
    }

    if (branch.client.socket) {
      branch.client.socket = null
      emit(branch, root, 'connected', false, createStamp(branch.stamp))
    }

    if (!socket.blockReconnect) {
      reconnect = Math.min((reconnect * 1.5), 2000)
      branch.client.reconnect = setTimeout(connect, reconnect, branch, url, reconnect)
    }
  }

  socket.onclose = onClose

  socket.onerror = isNode ? onClose : socket.close.bind(socket)

  socket.onopen = () => {
    branch.client.socket = socket
    emit(branch, root, 'connected', true, createStamp(branch.stamp))
  }

  socket.onmessage = ({ data }) => {
    (
      (
        typeof data !== 'string' &&
        (
          data instanceof ArrayBuffer ||
          (('Blob' in global) && data instanceof Blob) || // eslint-disable-line
          (('WebkitBlob' in global) && data instanceof WebkitBlob) // eslint-disable-line
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
}

export { connect }
