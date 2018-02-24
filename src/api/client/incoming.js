import { setOffset } from '../../stamp'

const heartbeatTimeout = 3e3

const heartbeat = branch => {
  const socket = branch.client.socket

  if (socket) {
    if (socket.heartbeat) {
      clearTimeout(socket.heartbeat)
      socket.heartbeat = null
    }
    socket.send(JSON.stringify({ h: true }))
    socket.heartbeat = setTimeout(() => heartbeat(branch), heartbeatTimeout)
  }
}

const fireEmits = (branch, emits) => {

}

const setLeaves = (branch, leaves) => {

}

const incoming = (branch, data) => {
  const { t: stamp, h: heartbeat, e: emits, l: leaves } = data

  if (stamp) {
    setOffset(branch.stamp, stamp)
  }

  if (heartbeat) {
    heartbeat(branch)
  }

  if (emits) {
    fireEmits(branch, emits)
  }

  if (leaves) {
    setLeaves(branch, leaves)
  }
}

export { incoming }
