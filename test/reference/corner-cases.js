const test = require('tape')
const { create } = require('../../dist/index')

test('references - from another branch', t => {
  const master1 = create({
    deep: {
      real: 'thing'
    },
    pointers: {
      pointer2: [ '@', 'deep', 'real' ]
    }
  })

  try {
    const master2 = create()

    master2.set({
      pointers: {
        pointer1: master1.get('deep')
      }
    })
  } catch (error) {
    t.equals(error.message, 'Reference must be in same branch', 'Reference must be in same branch')
  }

  const branch1 = master1.create({
    deep: null
  })

  try {
    const branch2 = branch1.create()

    branch2.set({
      pointers: {
        pointer1: master1.get('deep')
      }
    })
  } catch (error) {
    t.equals(error.message, 'Reference must be in same branch', 'Reference must be in same branch')
  }

  try {
    const master3 = create({
      deep: {
        real: 'thing3'
      },
      pointers: {
        pointer1: [ '@', 'deep', 'real' ]
      }
    })

    master3.set({
      pointers: {
        pointer1: master1.get('deep')
      }
    })
  } catch (error) {
    t.equals(error.message, 'Reference must be in same branch', 'Reference must be in same branch')
  }

  const branch3 = master1.create({
    deep: null
  })

  try {
    const branch4 = branch3.create({
      deep: {
        real: 'thing3'
      },
      pointers: {
        pointer1: [ '@', 'deep', 'real' ]
      }
    })

    branch4.set({
      pointers: {
        pointer1: master1.get('deep')
      }
    })
  } catch (error) {
    t.equals(error.message, 'Reference must be in same branch', 'Reference must be in same branch')
  }

  const branch5 = master1.create({
    pointers: {
      pointer1: [ '@', 'deep' ]
    }
  })

  branch5.set({
    pointers: {
      pointer1: master1.get([ 'pointers', 'pointer2' ]),
      pointer2: master1.get([ 'deep', 'real' ])
    }
  })

  t.equals(
    branch5.get([ 'pointers', 'pointer1' ]).compute(),
    'thing',
    'branch5.pointers.pointer1.compute() = thing'
  )

  t.equals(
    branch5.get([ 'pointers', 'pointer2' ]).compute(),
    'thing',
    'branch5.pointers.pointer2.compute() = thing'
  )

  t.end()
})

test('references - ignore same reference in branch', t => {
  const master = create({
    real1: 'thing1',
    real2: 'thing2',
    pointer1: [ '@', 'real1' ],
    pointer2: [ '@', 'real2' ]
  })

  const branch = master.create({
    pointer1: [ '@', 'real1' ],
    pointer2: {
      subKey: 'thing3'
    }
  })

  branch.get('pointer2').set([ '@', 'real2' ])
  master.get('pointer1').set([ '@', 'real2' ])
  master.get('pointer2').set([ '@', 'real1' ])

  t.equals(
    branch.get('pointer1').compute(),
    'thing2',
    'branch.pointer1.compute() = thing2'
  )

  t.equals(
    branch.get('pointer2').compute(),
    'thing1',
    'branch.pointer1.compute() = thing1'
  )

  t.end()
})
