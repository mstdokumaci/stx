const test = require('tape')
const { Struct } = require('../')

test('set - get', t => {
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

  t.equals(
    master.get(['pointers', 'pointer1', 'real']).compute(),
    'thing',
    'pointers.pointer1.real.compute() = thing'
  )
  t.equals(
    master.get(['pointers', 'pointer2']).compute(),
    'thing',
    'pointers.pointer2.compute() = thing'
  )
  t.equals(
    master.get(['pointers', 'pointer3', 'real']).compute(),
    'thing',
    'pointers.pointer3.real.compute() = thing'
  )
  t.equals(
    master.get(['pointers', 'pointer4']).compute(),
    'thing',
    'pointers.pointer4.compute() = thing'
  )
  t.equals(
    master.inspect(),
    'Struct { deep, pointers }',
    'master.inspect() = Struct { deep, pointers }'
  )
  t.equals(
    master.get('pointers').inspect(),
    'Struct pointers { pointer1, pointer2, pointer3, pointer4 }',
    'master.pointers.inspect() = Struct pointers { pointer1, pointer2, pointer3, pointer4 }'
  )
  t.equals(
    master.get(['pointers', 'pointer2']).inspect(),
    'Struct pointer2 { val: Struct real { val: thing } }',
    'master.pointers.pointer2.inspect() = Struct pointer2 { val: Struct real { val: thing } }'
  )
  t.same(
    master.get(['deep', 'real']).path(),
    [ 'deep', 'real' ],
    'master.deep.real.path() = [ \'deep\', \'real\' ]'
  )
  t.same(
    master.serialize(),
    {
      deep: { real: 'thing' },
      pointers: {
        pointer1: [ '@', 'deep' ],
        pointer2: [ '@', 'deep', 'real' ],
        pointer3: [ '@', 'pointers', 'pointer1' ],
        pointer4: [ '@', 'pointers', 'pointer2' ]
      }
    },
    'master.pointers.serialize() = good'
  )
  t.same(
    master.get('pointers').serialize(),
    {
      pointer1: [ '@', 'deep' ],
      pointer2: [ '@', 'deep', 'real' ],
      pointer3: [ '@', 'pointers', 'pointer1' ],
      pointer4: [ '@', 'pointers', 'pointer2' ]
    },
    'master.pointers.serialize() = good'
  )
  t.same(
    master.get('deep').serialize(),
    { real: 'thing' },
    'master.pointers.serialize() = { real: \'thing\' }'
  )
  t.equals(
    master.get('pointers').get('pointer5', ['@', 'pointers', 'pointer1']).origin().get('real').compute(),
    'thing',
    'master.pointers.pointer5.origin().real.compute() = thing'
  )

  master.get(['pointers', 'pointer6'], ['@', 'pointers', 'pointer5'])

  t.equals(
    master.get(['pointers', 'pointer6', 'real']).compute(),
    'thing',
    'master.pointers.pointer6.real.compute() = thing'
  )

  t.end()
})

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
