const { create } = require('../dist/index')

const state = create({ firstKey: 'value' })
console.log(state.serialize())

state.set({ second: { subKey: 'subValue' } })
console.log(state.serialize())

console.log(state.get('second').serialize())

state.set({ firstKey: null })
console.log(state.get('firstKey'))

console.log(state.serialize())

const subKey = state.get(['second', 'subKey'])
console.log(subKey.compute())

console.log(subKey.path())

console.log(subKey.parent().serialize())

console.log(subKey.root().serialize())

let results = []
state.set({ third: 3 })
const third = state.get('third')
const listener = third
  .on((val, stamp, item) => results.push(`${val}-${item.compute()}`))
console.log(results)
third.set('changed')
console.log(results)
state.set({ third: 'again' })
console.log(results)

listener.off()
third.set('yet again')
console.log(results)

const errors = []
state.on('error', err => errors.push(err))
state.emit('error', 'satellites are not aligned')
console.log(errors)
subKey.on('error', err => errors.push(err))
subKey.emit('error', 'splines are not reticulated')
console.log(errors)

