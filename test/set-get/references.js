const test = require('tape')
const { create } = require('../../dist')

test('set - get - references', t => {
  const master = create()

  master.set({
    deep: {
      real: 'thing',
      dummy: undefined
    },
    pointers: {
      pointer1: ['@', 'deep'],
      pointer2: ['@', 'deep', 'real'],
      pointer3: ['@', 'pointers', 'pointer1'],
      pointer4: ['@', 'pointers', 'pointer2']
    },
    dummy: undefined
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
    'stx { deep, pointers }',
    'master.inspect() = stx { deep, pointers }'
  )
  t.equals(
    master.get('pointers').inspect(),
    'stx pointers { pointer1, pointer2, pointer3, pointer4 }',
    'master.pointers.inspect() = stx pointers { pointer1, pointer2, pointer3, pointer4 }'
  )
  t.equals(
    master.get(['pointers', 'pointer2']).inspect(),
    'stx pointer2 { val: stx real { val: thing } }',
    'master.pointers.pointer2.inspect() = stx pointer2 { val: stx real { val: thing } }'
  )
  t.same(
    master.get(['deep', 'real']).path(),
    ['deep', 'real'],
    'master.deep.real.path() = [ \'deep\', \'real\' ]'
  )
  t.same(
    master.serialize(),
    {
      deep: { real: 'thing' },
      pointers: {
        pointer1: ['@', 'deep'],
        pointer2: ['@', 'deep', 'real'],
        pointer3: ['@', 'pointers', 'pointer1'],
        pointer4: ['@', 'pointers', 'pointer2']
      }
    },
    'master.serialize() = correct'
  )
  t.same(
    master.get('pointers').serialize(),
    {
      pointer1: ['@', 'deep'],
      pointer2: ['@', 'deep', 'real'],
      pointer3: ['@', 'pointers', 'pointer1'],
      pointer4: ['@', 'pointers', 'pointer2']
    },
    'master.pointers.serialize() = correct'
  )
  t.same(
    master.get('deep').serialize(),
    { real: 'thing' },
    'master.deep.serialize() = { real: \'thing\' }'
  )

  const branch1 = master.create({
    deep: {
      real2: 'thing2'
    },
    pointers: {
      pointer1: {
        real3: 'thing3'
      }
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
        pointer1: {
          val: ['@', 'deep'],
          real3: 'thing3'
        },
        pointer2: ['@', 'deep', 'real2'],
        pointer3: ['@', 'pointers', 'pointer1'],
        pointer4: ['@', 'pointers', 'pointer2'],
        pointer5: ['@', 'pointers', 'pointer1'],
        pointer6: ['@', 'pointers', 'pointer5']
      }
    },
    'branch1.serialize() = correct'
  )
  t.equals(
    branch1.get(['pointers', 'pointer1']).inspect(),
    'stx pointer1 { val: stx deep { real2, real }, real3 }',
    'branch1.pointers.pointer1.inspect() = stx pointer1 { val: stx deep { real2, real }, real3 }'
  )

  t.end()
})
