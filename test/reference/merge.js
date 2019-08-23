const test = require('tape')
const { create } = require('../../dist')

test('references - merge', t => {
  const master = create({
    id: 'master',
    real: {
      rA: { name: 'A' },
      rB: { name: 'B' }
    },
    pointer: {
      p1: ['@', 'real', 'rA'],
      p2: ['@', 'real', 'rB']
    }
  })

  const branch1 = master.create({
    id: 'branch1',
    real: { rA: { field: 1 } },
    pointer: { p1: { pField: 11 } }
  })

  const branch2 = master.create({
    id: 'branch2',
    real: { rB: { field: 2 } },
    pointer: { p2: { pField: 22 } }
  })

  const branch3 = branch1.create({
    id: 'branch3',
    real: { rB: { field: 3 } },
    pointer: { p2: { pField: false } }
  })

  const branch4 = branch2.create({
    id: 'branch4',
    real: { rA: { field: 4 } },
    pointer: { p1: { pField: true } }
  })

  master.set({
    pointer: {
      p1: ['@', 'real', 'rB'],
      p2: ['@', 'real', 'rA']
    }
  })

  t.equals(
    branch3.get(['pointer', 'p2', 'pField']).compute(), false,
    'branch3 p2 pField is correct'
  )
  t.equals(
    branch3.get(['pointer', 'p2', 'field']).compute(), 1,
    'branch3 p2 field is correct'
  )
  t.equals(
    branch4.get(['pointer', 'p1', 'pField']).compute(), true,
    'branch4 p1 pField is correct'
  )
  t.equals(
    branch4.get(['pointer', 'p1', 'field']).compute(), 2,
    'branch4 p1 field is correct'
  )

  t.end()
})
