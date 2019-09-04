import { setOffset } from '../../stamp'
import {
  remove,
  removeOwn,
  removeReferenceFromBranches,
  removeListenersSubscriptions
} from '../remove'
import { addOwnLeaf } from '../set/utils'
import { setOwnExistingVal, setOwnExistingReference } from '../set/own-existing'
import { setOwnNewVal, setOwnNewReference } from '../set/own-new'
import { addDataEvent, emitDataEvents } from '../listeners/emit'
import { addToStrings } from '../../cache'

const heartbeatTimeout = 3e3

const startHeartbeat = branch => {
  const socket = branch.client.socket

  if (socket) {
    if (socket.heartbeat) {
      clearTimeout(socket.heartbeat)
    }

    socket.send(JSON.stringify({ h: true }))
    socket.heartbeat = setTimeout(() => startHeartbeat(branch), heartbeatTimeout)
  }
}

const cleanLeaves = (branch, list) => {
  for (let id in list) {
    id = Number(id)
    const leaf = branch.leaves[id]
    if (leaf) {
      removeOwn(branch, id, leaf.rT && leaf.val, list[id], list[leaf.parent])
      if (leaf.rT) {
        removeReferenceFromBranches(branch, id, leaf.val)
      }
      removeListenersSubscriptions(branch, id)
    }
  }
}

const removeLeaves = (branch, list) => {
  for (const id in list) {
    const stamp = list[id]
    if (branch.leaves[id]) {
      remove(branch, Number(id), stamp)
    }
  }
}

const setLeaves = (branch, leaves) => {
  for (let id in leaves) {
    id = Number(id)
    const [key, parent, stamp, val, rT, keys, depth] = leaves[id]

    if (id in branch.leaves) {
      const leaf = branch.leaves[id]

      if (rT) {
        setOwnExistingReference(branch, leaf, id, val, stamp)
      } else if (val !== null) {
        setOwnExistingVal(branch, leaf, id, val, stamp)
      }

      if (keys && keys.length) {
        let added = false
        keys.forEach(key => {
          if (!leaf.keys.has(key)) {
            leaf.keys.add(key)
            added = true
          }
        })
        if (added) {
          addDataEvent(undefined, id, 'add-key')
        }
      }
    } else {
      const leaf = addOwnLeaf(branch, id, parent, key, depth, stamp)

      if (rT) {
        setOwnNewReference(branch, leaf, id, val, stamp)
      } else if (val !== null) {
        setOwnNewVal(branch, leaf, id, val, stamp)
      }

      if (keys && keys.length) {
        keys.forEach(key => leaf.keys.add(key))
        addDataEvent(undefined, id, 'add-key')
      }
    }
  }
}

const setStrings = strings => {
  for (const id in strings) {
    addToStrings(id, strings[id])
  }
}

const incoming = (branch, data) => {
  const { t: stamp, h: heartbeat, l: leaves, c: clean, s: strings, r: remove } = data

  if (stamp !== undefined) {
    setOffset(branch.stamp, stamp)
  }

  branch.client.stopSending = true

  if (clean) {
    cleanLeaves(branch, clean)
  }

  if (remove) {
    removeLeaves(branch, remove)
  }

  if (strings) {
    setStrings(strings)
  }

  if (leaves) {
    setLeaves(branch, leaves)
  }

  emitDataEvents(branch, stamp)
  branch.client.stopSending = false

  if (heartbeat) {
    startHeartbeat(branch)
  }
}

export { incoming }
