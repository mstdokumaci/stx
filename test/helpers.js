const persistentStorage = {}

exports.Persist = function (name) {
  this.start = async () => {
    if (!persistentStorage[name]) {
      persistentStorage[name] = {}
    }

    this.storage = persistentStorage[name]
  }

  this.store = (key, value) => {
    this.storage[key] = JSON.stringify(value)
  }

  this.remove = key => {
    delete this.storage[key]
  }

  this.load = async loadLeaf => {
    for (const key in this.storage) {
      loadLeaf(key, JSON.parse(this.storage[key]))
    }
  }

  this.stop = async () => {}
}
