import { setOffset } from '../../stamp'
import { remove } from '../remove'
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

const removeLeaves = (branch, list) => {
  for (const id in list) {
    const stamp = list[id]
    if (branch.leaves[id]) {
      const leaf = branch.leaves[id]
      remove(branch, leaf, id, stamp)
    }
  }
}

const setLeaves = (branch, leaves, stamp) => {
  for (let id in leaves) {
    id = Number(id)
    const [ key, parent, stamp, val, rT, keys ] = leaves[id]

    if (branch.leaves[id]) {
      const leaf = branch.leaves[id]

      if (val) {
        setOwnExistingVal(branch, leaf, id, val, stamp)
      } else if (rT) {
        setOwnExistingReference(branch, leaf, id, rT, stamp)
      }

      if (keys && keys.length) {
        if (leaf.keys && leaf.keys.length) {
          const added = keys.filter(key => !~leaf.keys.indexOf(key))
          if (added) {
            leaf.keys = leaf.keys.concat(added)
            addDataEvent(void 0, id, 'add-key')
          }
        } else {
          leaf.keys = keys
          addDataEvent(void 0, id, 'add-key')
        }
      }
    } else {
      const leaf = addOwnLeaf(branch, id, parent, key, stamp)

      if (val) {
        setOwnNewVal(branch, leaf, id, val, stamp)
      } else if (rT) {
        setOwnNewReference(branch, leaf, id, rT, stamp)
      }

      if (keys && keys.length) {
        leaf.keys = keys
        addDataEvent(void 0, id, 'add-key')
      }
    }
  }

  emitDataEvents(branch, stamp)
}

const incoming = (branch, data) => {
  const { t: stamp, h: heartbeat, l: leaves, r: remove } = data

  setOffset(branch.stamp, stamp)

  if (remove) {
    removeLeaves(branch, remove)
  }

  if (leaves) {
    setLeaves(branch, leaves, stamp)
  }

  if (heartbeat) {
    startHeartbeat(branch)
  }
}

export { incoming }
