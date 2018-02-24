const setOffset = (config, stamp) => {
  config.offset = (stamp | 0) - (createStamp(config) | 0) + config.offset
  config.inProgress = false
}

const createStamp = config => {
  if (!config) { config = { offset: 0 } }

  if (config.inProgress) {
    config.ms += ++config.count / 9999
  } else {
    config.count = 0
    config.ms = Date.now() + config.offset
    config.inProgress = true
    setTimeout(() => {
      config.inProgress = false
    })
  }

  return config.ms
}

export { createStamp, setOffset }
