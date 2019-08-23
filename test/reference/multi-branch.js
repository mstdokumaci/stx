const test = require('tape')
const { create } = require('../../dist')

test('references - multi branch origin', t => {
  const master = create({
    deep: {
      real: {
        field: 'is a thing'
      }
    },
    pointers: {
      pointer1: ['@', 'deep']
    }
  })

  const branch1 = master.create()
  const branch2 = master.create()
  const branch3 = master.create()

  branch1.set({
    deep: {
      real: {
        field: 'override 1'
      }
    },
    pointers: {
      pointer2: ['@', 'pointers', 'pointer1']
    }
  })

  branch2.set({
    deep: {
      real: {
        field: 'override 2'
      }
    },
    pointers: {
      pointer2: ['@', 'deep', 'real']
    }
  })

  branch3.set({
    deep: {
      real: {
        field: 'override 3'
      }
    },
    pointers: {
      pointer2: ['@', 'pointers', 'pointer1']
    }
  })

  const b2p2 = branch2.get(['pointers', 'pointer2'])
  const b3p2 = branch3.get(['pointers', 'pointer2'])
  const b1p2 = branch1.get(['pointers', 'pointer2'])

  b3p2.origin().set({ real: { other: 3 } })
  b2p2.origin().set({ other: 2 })
  b1p2.origin().set({ real: { other: 1 } })

  t.equals(
    branch1.get(['pointers', 'pointer2']).get(['real', 'field']).compute(),
    'override 1',
    'branch1.pointers.pointer2.real.field =  override 1'
  )

  t.equals(
    branch1.get(['pointers', 'pointer2', 'real', 'field']).compute(),
    'override 1',
    'branch1.pointers.pointer2.real.field = override 1'
  )

  t.equals(
    branch2.get(['pointers', 'pointer1', 'real', 'other']).compute(),
    2,
    'branch2.pointers.pointer1.real.other = 2'
  )

  t.equals(
    branch2.get(['pointers', 'pointer2', 'field']).compute(),
    'override 2',
    'branch2.pointers.pointer2.filed = override 2'
  )

  t.equals(
    branch3.get(['pointers', 'pointer2', 'real', 'field']).compute(),
    'override 3',
    'branch2.pointer2.real.filed = override 3'
  )

  t.same(
    master.get('deep').serialize(),
    { real: { field: 'is a thing' } },
    'master.deep.serialize() = correct'
  )

  t.same(
    branch1.get('deep').serialize(),
    { real: { field: 'override 1', other: 1 } },
    'branch1.deep.serialize() = correct'
  )

  t.same(
    branch2.get('deep').serialize(),
    { real: { field: 'override 2', other: 2 } },
    'branch2.deep.serialize() = correct'
  )

  t.same(
    branch3.get('deep').serialize(),
    { real: { field: 'override 3', other: 3 } },
    'branch3.deep.serialize() = correct'
  )

  t.end()
})
