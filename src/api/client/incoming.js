const adjustStamp = (branch, stamp) => {

}

const startHeartbeat = branch => {

}

const fireEmits = (branch, emits) => {

}

const setLeaves = (branch, leaves) => {

}

const incoming = (branch, data) => {
  const { t: stamp, h: heartbeat, e: emits, l: leaves } = data

  if (stamp) {
    adjustStamp(branch, stamp)
  }

  if (heartbeat) {
    startHeartbeat(branch)
  }

  if (emits) {
    fireEmits(branch, emits)
  }

  if (leaves) {
    setLeaves(branch, leaves)
  }
}

export { incoming }
