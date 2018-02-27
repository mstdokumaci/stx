import { setOffset } from '../../stamp'

const heartbeatTimeout = 3e3

const startHeartbeat = branch => {
  const socket = branch.client.socket

  if (socket) {
    if (socket.heartbeat) {
      clearTimeout(socket.heartbeat)
      socket.heartbeat = null
    }

    socket.send(JSON.stringify({ h: true }))
    socket.heartbeat = setTimeout(() => startHeartbeat(branch), heartbeatTimeout)
  }
}

const setLeaves = (branch, leaves) => {

}

const incoming = (branch, data) => {
  const { t: stamp, h: heartbeat, l: leaves } = data

  if (stamp) {
    setOffset(branch.stamp, stamp)
  }

  if (heartbeat) {
    startHeartbeat(branch)
  }

  if (leaves) {
    setLeaves(branch, leaves)
  }
}

export { incoming }
