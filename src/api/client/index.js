import { root } from '../../id'
import { createStamp } from '../../stamp'
import define from '../../define'
import { emit } from '../listeners/emit'
import { sendAllSubscriptions } from './send'
import receiveLarge from './receiveLarge'
import WebSocket from './websocket'
import { incoming } from './incoming'

const isNode = typeof window === 'undefined'

const socketClose = WebSocket.prototype.close
define(WebSocket.prototype, 'close', function (code, data) {
  if (this.heartbeat) {
    clearTimeout(this.heartbeat)
  }
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

  branch.client.socket = {}
  const socket = new WebSocket(url)

  socket.onclose = () => {
    if (socket.heartbeat) {
      clearTimeout(socket.heartbeat)
    }

    if (branch.client.socket) {
      branch.client.socket = null
      emit(branch, root, 'connected', false, createStamp(branch.stamp))
    }

    if (socket.blockReconnect) {
      branch.client.queue = null
    } else {
      reconnect = Math.min((reconnect * 1.5), 2000)
      branch.client.reconnect = setTimeout(connect, reconnect, branch, url, reconnect)
    }
  }

  socket.onerror = isNode ? socket.onclose : () => socket.close()

  socket.onopen = () => {
    branch.client.socket = socket
    branch.client.queue = { s: [], e: [] }

    sendAllSubscriptions(branch)

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

  return branch.client
}

export { connect }