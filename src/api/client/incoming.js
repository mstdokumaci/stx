import { setOffset } from '../../stamp'
import { addOwnLeaf } from '../set'
import { setOwnExistingVal, setOwnExistingReference } from '../set/own-existing'
import { setOwnNewVal, setOwnNewReference } from '../set/own-new'
import { addDataEvent, emitDataEvents } from '../listeners/emit'

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

const setLeaves = (branch, leaves, stamp) => {
  for (const id in leaves) {
    const [ key, parent, stamp, val, rT, keys ] = leaves[id]

    if (branch.leaves[id]) {
      const leaf = branch.leaves[id]

      if (val) {
        setOwnExistingVal(branch, leaf, id, val, stamp)
      } else if (rT) {
        setOwnExistingReference(branch, leaf, id, rT, stamp)
      }

      if (keys) {
        if (leaf.keys) {
          if (keys.find(key => !~leaf.keys.indexOf(key))) {
            addDataEvent(void 0, id, 'add-key')
          }
          if (leaf.keys.find(key => !~keys.indexOf(key))) {
            addDataEvent(void 0, id, 'remove-key')
          }
        } else {
          addDataEvent(void 0, id, 'add-key')
        }

        leaf.keys = keys
      }
    } else {
      const leaf = addOwnLeaf(branch, id, parent, key, stamp)

      if (val) {
        setOwnNewVal(branch, leaf, id, val, stamp)
      } else if (rT) {
        setOwnNewReference(branch, leaf, id, rT, stamp)
      }

      if (keys && keys.length) {
        addDataEvent(void 0, id, 'add-key')
        leaf.keys = keys
      }
    }
  }

  emitDataEvents(branch, stamp)
}

const incoming = (branch, data) => {
  const { t: stamp, h: heartbeat, l: leaves } = data

  if (stamp) {
    setOffset(branch.stamp, stamp)

    if (leaves) {
      setLeaves(branch, leaves, stamp)
    }
  }

  if (heartbeat) {
    startHeartbeat(branch)
  }
}

export { incoming }
