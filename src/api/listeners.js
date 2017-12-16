import { setVal } from './set'

let lastId = 0

const listen = (leaf, event, cb, id) => {
  if (!id) {
    id = lastId++
  }

  leaf = setVal(leaf.branch, leaf, void 0)

  if (!leaf.listeners) {
    leaf.listeners = { [ event ]: {} }
  } else if (!leaf.listeners[event]) {
    leaf.listeners[event] = {}
  }

  leaf.listeners[event][id] = cb
}

const unListen = (leaf, event, id) => {

}

const emit = (leaf, event, val, stamp) => {

}

export { listen, unListen, emit }
