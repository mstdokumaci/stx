const defaultConfig = { offset: 0 }

const setOffset = (config, stamp) => {
  config.offset = stamp - Date.now()
  config.inProgress = false
}

const createStamp = config => {
  if (!config) {
    config = defaultConfig
  }

  if (config.inProgress) {
    config.ms += ++config.count / 999
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
