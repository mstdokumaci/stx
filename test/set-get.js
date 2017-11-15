const test = require('tape')
const { Struct } = require('../')

test('set - get references', t => {
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
    'master.pointers.serialize() = correct'
  )
  t.same(
    master.get('pointers').serialize(),
    {
      pointer1: [ '@', 'deep' ],
      pointer2: [ '@', 'deep', 'real' ],
      pointer3: [ '@', 'pointers', 'pointer1' ],
      pointer4: [ '@', 'pointers', 'pointer2' ]
    },
    'master.pointers.serialize() = correct'
  )
  t.same(
    master.get('deep').serialize(),
    { real: 'thing' },
    'master.pointers.serialize() = { real: \'thing\' }'
  )

  const branch1 = master.create({
    deep: {
      real2: 'thing2'
    }
  })

  branch1.get(['pointers', 'pointer2']).set(['@', 'deep', 'real2'])

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

  t.equals(
    branch1.get(['pointers', 'pointer2']).compute(),
    'thing2',
    'branch1.pointers.pointer2.compute() = thing2'
  )
  t.same(
    branch1.serialize(),
    {
      deep: {
        real2: 'thing2',
        real: 'thing'
      },
      pointers: {
        pointer1: [ '@', 'deep' ],
        pointer2: [ '@', 'deep', 'real2' ],
        pointer3: [ '@', 'pointers', 'pointer1' ],
        pointer4: [ '@', 'pointers', 'pointer2' ],
        pointer5: [ '@', 'pointers', 'pointer1' ],
        pointer6: [ '@', 'pointers', 'pointer5' ]
      }
    },
    'branch1.serialize() = correct'
  )

  t.end()
})

test('set - get - arrays', t => {
  const master = new Struct()

  master.set({
    deep: {
      real: [ 1, 2, 3 ]
    },
    pointers: {
      pointer1: ['@', 'deep', 'real'],
      pointer2: ['@', 'pointers', 'pointer1']
    }
  })

  t.same(
    master.get(['pointers', 'pointer1']).compute(),
    [ 1, 2, 3 ],
    'pointers.pointer1.compute() = [ 1, 2, 3 ]'
  )
  t.same(
    master.get(['pointers', 'pointer2']).compute(),
    [ 1, 2, 3 ],
    'pointers.pointer2.compute() = [ 1, 2, 3 ]'
  )
  t.equals(
    master.inspect(),
    'Struct { deep, pointers }',
    'master.inspect() = Struct { deep, pointers }'
  )
  t.same(
    master.serialize(),
    {
      deep: {
        real: [ 1, 2, 3 ]
      },
      pointers: {
        pointer1: ['@', 'deep', 'real'],
        pointer2: ['@', 'pointers', 'pointer1']
      }
    },
    'master.pointers.serialize() = correct'
  )
  t.same(
    master.get(['deep', 'real']).inspect(),
    'Struct real { val: 1,2,3 }',
    'master.deep.real.inspect() = Struct real { val: 1,2,3 }'
  )

  const branch1 = master.create({
    deep: {
      real: [ 3, 2, 1 ]
    }
  })

  t.same(
    branch1.get(['pointers', 'pointer2']).compute(),
    [ 3, 2, 1 ],
    'branch1.pointers.pointer2.compute() = [ 3, 2, 1 ]'
  )
  t.same(
    branch1.serialize(),
    {
      deep: { real: [ 3, 2, 1 ] },
      pointers: {
        pointer1: [ '@', 'deep', 'real' ],
        pointer2: [ '@', 'pointers', 'pointer1' ]
      }
    },
    'branch1.serialize() = correct'
  )

  t.end()
})
