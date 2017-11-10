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
