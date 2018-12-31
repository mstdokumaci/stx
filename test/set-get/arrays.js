const test = require('tape')
const { create, createStamp } = require('../../dist')

test('set - get - arrays', t => {
  const master = create()
  const stamp = createStamp()

  master.set({
    deep: {
      real: [ 1, 2, 3 ]
    },
    pointers: {
      pointer1: [ '@', 'deep', 'real' ],
      pointer2: [ '@', 'pointers', 'pointer1' ]
    },
    dummy: null
  }, stamp)

  t.same(
    master.get([ 'pointers', 'pointer1' ]).compute(),
    [ 1, 2, 3 ],
    'pointers.pointer1.compute() = [ 1, 2, 3 ]'
  )
  t.same(
    master.get([ 'pointers', 'pointer2' ]).compute(),
    [ 1, 2, 3 ],
    'pointers.pointer2.compute() = [ 1, 2, 3 ]'
  )
  t.equals(
    master.inspect(),
    'stx { deep, pointers }',
    'master.inspect() = stx { deep, pointers }'
  )
  t.same(
    master.serialize(),
    {
      deep: {
        real: [ 1, 2, 3 ]
      },
      pointers: {
        pointer1: [ '@', 'deep', 'real' ],
        pointer2: [ '@', 'pointers', 'pointer1' ]
      }
    },
    'master.pointers.serialize() = correct'
  )
  t.same(
    master.get([ 'deep', 'real' ]).inspect(),
    'stx real { val: 1,2,3 }',
    'master.deep.real.inspect() = stx real { val: 1,2,3 }'
  )

  const branch1 = master.create({
    deep: {
      real: [ 3, 2, 1 ],
      other: {}
    }
  })

  master.set({
    deep: {
      real: [ 2, 3, 1 ],
      other: {}
    }
  })

  t.same(
    master.get([ 'pointers', 'pointer2' ]).compute(),
    [ 2, 3, 1 ],
    'branch1.pointers.pointer2.compute() = [ 2, 3, 1 ]'
  )
  t.same(
    master.serialize(),
    {
      deep: {
        other: {},
        real: [ 2, 3, 1 ]
      },
      pointers: {
        pointer1: [ '@', 'deep', 'real' ],
        pointer2: [ '@', 'pointers', 'pointer1' ]
      }
    },
    'master.serialize() = correct'
  )
  t.equals(
    master.get([ 'deep', 'other' ]).inspect(),
    'stx other { }',
    'master.deep.other.inspect() = stx other { }'
  )
  t.same(
    branch1.get([ 'pointers', 'pointer2' ]).compute(),
    [ 3, 2, 1 ],
    'branch1.pointers.pointer2.compute() = [ 3, 2, 1 ]'
  )
  t.same(
    branch1.serialize(),
    {
      deep: {
        other: {},
        real: [ 3, 2, 1 ]
      },
      pointers: {
        pointer1: [ '@', 'deep', 'real' ],
        pointer2: [ '@', 'pointers', 'pointer1' ]
      }
    },
    'branch1.serialize() = correct'
  )

  t.end()
})
