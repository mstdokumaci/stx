import define from '../../define'

let listenerLastId = 0

const Listener = function (branch, id, event, listenerId) {
  this.branch = branch
  this.id = id
  this.event = event
  this.listenerId = listenerId
}

define(Listener.prototype, 'off', function () {
  delete this.branch.listeners[this.id][this.event][this.listenerId]
})

const on = (branch, id, event, cb) => {
  const listenerId = listenerLastId++

  const listeners = branch.listeners

  if (!listeners[id]) {
    listeners[id] = { [ event ]: {} }
  } else if (!listeners[id][event]) {
    listeners[id][event] = {}
  }

  listeners[id][event][listenerId] = cb

  return new Listener(branch, id, event, listenerId)
}

export { on }
