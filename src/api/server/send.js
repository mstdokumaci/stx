const sendLeaves = (socket, branch, isMaster, id, keys, excludeKeys, depth, limit) => {
  if (branch.leaves[id] === null) {
    return
  }

  serializeLeaf(socket, branch, id, depth)

  if (keys) {
    keys.forEach(key => serializeWithChildren(socket, branch, key, depth - 1))
  } else if (limit) {

  } else {

  }
}

const serializeWithChildren = (socket, branch, id, depth) => {
  if (branch.leaves[id] === null) {
    return
  }

  serializeLeaf(socket, branch, id, depth)
}

const serializeLeaf = (socket, branch, id, depth) => {
  const oBranch = branch
  let key, parent, stamp, val, rT, keys

  while (branch) {
    const leaf = branch.leaves[id]
    if (leaf === null) {
      break
    } else if (leaf) {
      if (!val && !rT) {
        if (leaf.val) {
          val = leaf.val
        } else if (leaf.rT) {
          rT = leaf.rT
          serializeWithChildren(socket, oBranch, leaf.rT, depth)
        }
      }

      if (leaf.keys) {
        keys = (keys || []).concat(leaf.keys)
      }

      if (leaf.stamp > stamp) {
        stamp = leaf.stamp
      }

      if (!key && leaf.key) {
        key = leaf.key
        if (leaf.parent) {
          parent = leaf.parent
        }
      }
    }

    branch = branch.inherits
  }

  socket.queue.l.push([ id, key, parent, stamp, val, rT, keys ])
}

export { sendLeaves }
