const switchBranch = (socket, master, branchKey) => {

}

const syncSubscriptions = (branch, subscriptions) => {

}

const fireEmits = (branch, emits) => {

}

const setLeaves = (branch, leaves) => {

}

const incoming = (server, socketId, socket, master, data) => {
  const { b: branchKey, s: subscriptions, e: emits, l: leaves } = data

  if (branchKey !== void 0 && branchKey !== socket.branchKey) {
    switchBranch(socket, master, branchKey)
  }

  if (subscriptions) {
    syncSubscriptions(socket.branch, subscriptions)
  }

  if (emits) {
    fireEmits(socket.branch, emits)
  }

  if (leaves) {
    setLeaves(socket.branch, leaves)
  }
}

export { incoming }
