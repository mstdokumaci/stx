const test = require('tape')
const { create } = require('../../dist')

test('references - override', t => {
  const master = create({
    real1: 'thing1',
    real2: 'thing2',
    pointer1: [ '@', 'real2' ],
    pointer2: [ '@', 'real1' ]
  })

  const branch1 = master.create()

  const branch2 = branch1.create({
    real1: 'updated',
    pointer2: {
      deep: 'thing4'
    }
  })

  branch1.set({
    pointer1: [ '@', 'real1' ]
  })

  t.equals(
    branch2.get('pointer1').compute(),
    'updated',
    'branch2.pointer1.compute() = updated'
  )

  t.equals(
    branch2.get('pointer2').compute(),
    'updated',
    'branch2.pointer2.compute() = updated'
  )

  t.equals(
    branch2.get([ 'pointer2', 'deep' ]).compute(),
    'thing4',
    'branch2.pointer2.deep.compute() = thing4'
  )

  branch1.set({
    pointer1: 'literal'
  })

  t.equals(
    branch2.get('pointer1').compute(),
    'literal',
    'branch2.pointer1.compute() = literal'
  )

  master.set({
    pointer1: 'thing3'
  })

  t.equals(
    master.get('pointer1').compute(),
    'thing3',
    'master.pointer1.compute() = thing3'
  )

  t.equals(
    branch1.get('pointer1').compute(),
    'literal',
    'branch1.pointer1.compute() = literal'
  )

  const branch3 = branch2.create({
    pointer2: 'literal'
  })

  master.set({
    pointer2: null
  })

  t.equals(
    branch2.get('pointer2').compute(),
    void 0,
    'branch2.pointer2.compute() = undefined'
  )

  t.equals(
    branch2.get([ 'pointer2', 'deep' ]).compute(),
    'thing4',
    'branch2.pointer2.deep.compute() = thing4'
  )

  t.equals(
    branch3.get('pointer2').compute(),
    'literal',
    'branch3.pointer2.compute() = literal'
  )

  t.equals(
    branch3.get([ 'pointer2', 'deep' ]).compute(),
    'thing4',
    'branch3.pointer2.deep.compute() = thing4'
  )

  t.end()
})
