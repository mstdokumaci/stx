import { root } from '../../id'
import { createStamp } from '../../stamp'
import define from '../../define'
import { emit } from '../listeners/emit'
import {
  sendAllSubscriptions,
  addAllDataListener,
  removeAllDataListener
} from './send'
import { bindSocketListeners, WebSocket } from './websocket'
import { incoming } from './incoming'

const socketClose = WebSocket.prototype.close
define(WebSocket.prototype, 'close', function (code, data) {
  clearTimeout(this.heartbeat)
  removeAllDataListener(this.branch)
  this.blockReconnect = true
  socketClose.call(this, code, data)
})

const heartbeat = branch => {
  const socket = branch.client.socket

  if (socket) {
    clearTimeout(socket.heartbeat)
    socket.send(JSON.stringify({ h: 1 }))
    socket.heartbeat = setTimeout(() => heartbeat(branch), 8000)
  }
}

const connect = (branch, url, reconnect = 50) => {
  if (branch.client.reconnect) {
    clearTimeout(branch.client.reconnect)
    branch.client.reconnect = null
  } else if (branch.client.socket) {
    throw Error('Can not connect twice')
  }

  branch.client.socket = {}
  const socket = new WebSocket(url)

  const close = () => {
    if (branch.client.socket) {
      clearTimeout(branch.client.socket.heartbeat)
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

  const error = () => {
    if (socket.readyState === 1) {
      socket.close()
    }
  }

  const open = () => {
    socket.branch = branch
    branch.client.socket = socket
    branch.client.queue = { s: [], l: [], e: [] }
    heartbeat(branch)

    sendAllSubscriptions(branch)
    addAllDataListener(branch)

    emit(branch, root, 'connected', true, createStamp(branch.stamp))
  }

  const message = data => {
    if (data) {
      try {
        data = JSON.parse(data)
        if (!data) return
      } catch (e) {
        return e
      }

      incoming(branch, data)
    }
  }

  bindSocketListeners(socket, close, error, open, message)

  return branch.client
}

export { connect }
