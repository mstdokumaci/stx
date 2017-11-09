const { Struct } = require('../')

const master = new Struct()

master.set({
  deep: {
    real: 'thing'
  },
  pointers: {
    pointer1: ['@', 'deep'],
    pointer2: ['@', 'deep', 'real'],
    pointer3: ['@', 'pointers', 'pointer1'],
    pointer4: ['@', 'pointers', 'pointer2']
  }
})

console.log('compute pointer1/real:', master.get(['pointers', 'pointer1', 'real']).compute())
console.log('compute pointer2:', master.get(['pointers', 'pointer2']).compute())
console.log('compute pointer3/real:', master.get(['pointers', 'pointer3', 'real']).compute())
console.log('compute pointer4:', master.get(['pointers', 'pointer4']).compute())
console.log('inspect master:', master)
console.log('inspect pointers:', master.get('pointers'))
console.log('inspect pointer2:', master.get(['pointers', 'pointer2']))
console.log('path of deep/real:', master.get(['deep', 'real']).path())
console.log('serialize pointers:', master.get(['pointers']).serialize())
console.log('serialize deep:', master.get(['deep']).serialize())
console.log('serialize master:', master.serialize())

console.log('compute pointer5/real:', master.get('pointers').get('pointer5', ['@', 'pointers', 'pointer1']).origin().get('real').compute())
master.get(['pointers', 'pointer6'], ['@', 'pointers', 'pointer5'])
console.log('compute pointer6/real:', master.get(['pointers', 'pointer6', 'real']).compute())

const state = new Struct()

const arr = {}

const blur = {
  val: 'blurblurblur'
}
let i = 5
while (i--) {
  blur['x' + i] = 'blur' + i
}

i = 1e5
while (i--) {
  arr[i] = {
    val: 'hello' + i,
    a: 'a' + i,
    b: 'b' + i,
    c: 'c' + i,
    nested: blur
  }
}

let d = Date.now()
state.set(arr)
console.log('set + create 100k * 10', Date.now() - d, 'ms')

d = Date.now()
i = 1e5
let r
while (i--) {
  r = state.get(i)
  state.get([i, 'a'])
  state.get([i, 'b'])
  state.get([i, 'c'])
  r.get('nested')
  r.get(['nested', 'x0'])
  r.get(['nested', 'x1'])
  r.get(['nested', 'x2'])
  r.get(['nested', 'x3'])
  r.get(['nested', 'x4'])
}
console.log('get 100k * 10', Date.now() - d, 'ms', r)

console.log(state)
global.state = state

console.log(Object.keys(state.leaves).length)
