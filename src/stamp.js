let inProgress, count, ms

const createStamp = () => {
  if (inProgress) {
    ms += ++count / 9999
  } else {
    count = 0
    ms = Date.now()
    inProgress = true
    setTimeout(() => {
      inProgress = false
    })
  }
  return ms
}

export { createStamp }
