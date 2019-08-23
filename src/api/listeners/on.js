import define from '../../define'

let listenerLastId = 0

const Listener = function (branch, id, event, listenerId) {
  this.branch = branch
  this.id = id
  this.event = event
  this.listenerId = listenerId
}

define(Listener.prototype, 'off', function () {
  if (this.event === 'allData') {
    delete this.branch.listeners.allData[this.listenerId]
  } else {
    delete this.branch.listeners[this.id][this.event][this.listenerId]
  }
})

const on = (branch, id, event, cb) => {
  const listenerId = listenerLastId++

  const listeners = branch.listeners

  if (event === 'allData') {
    if (!listeners.allData) {
      listeners.allData = {}
    }

    listeners.allData[listenerId] = cb
  } else {
    if (!listeners[id]) {
      listeners[id] = { [event]: {} }
    } else if (!listeners[id][event]) {
      listeners[id][event] = {}
    }

    listeners[id][event][listenerId] = cb
  }

  return new Listener(branch, id, event, listenerId)
}

export { on }
