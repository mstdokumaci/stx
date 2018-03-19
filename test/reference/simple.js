const test = require('tape')
const { create } = require('../../dist/index')

test('references - simple', t => {
  const master = create()

  master.set({
    deep: {
      real: 'thing'
    },
    pointers: {
      pointer1: [ '@', 'deep' ],
      pointer2: [ '@', 'deep', 'real' ]
    }
  })

  const branch1 = master.create()

  branch1.set({
    deep: {
      real2: 'thing2'
    },
    pointers: {
      pointer3: [ '@', 'deep', 'real' ],
      pointer4: [ '@', 'deep', 'real2' ],
      pointer5: master.get([ 'pointers', 'pointer1' ])
    }
  })

  t.equals(
    branch1.get([ 'deep', 'real' ]).compute(),
    master.get([ 'deep', 'real' ]).compute(),
    'branch1.deep.real = master.deep.real'
  )
  t.equals(
    branch1.get([ 'deep', 'real2' ]).compute(),
    'thing2',
    'branch1.deep.real2.compute() = thing2'
  )
  t.equals(
    master.get([ 'deep', 'real2' ]),
    void 0,
    'master.deep.real2 = void 0'
  )

  t.equals(
    branch1.get([ 'pointers', 'pointer1', 'real' ]).compute(),
    master.get([ 'pointers', 'pointer1', 'real' ]).compute(),
    'branch1.pointers.pointer1.real.compute() = master.pointers.pointer1.real.compute()'
  )
  t.equals(
    branch1.get([ 'pointers', 'pointer2' ]).compute(),
    master.get([ 'pointers', 'pointer2' ]).compute(),
    'branch1.pointers.pointer2.compute() = master.pointers.pointer2.compute()'
  )

  t.equals(
    branch1.get([ 'pointers', 'pointer3' ]).compute(),
    master.get([ 'deep', 'real' ]).compute(),
    'branch1.pointers.pointer3 = master.deep.real'
  )
  t.equals(
    master.get([ 'pointers', 'pointer3' ]),
    void 0,
    'master.pointers.pointer3 = void 0'
  )

  t.equals(
    branch1.get([ 'pointers', 'pointer4' ]).compute(),
    'thing2',
    'branch1.pointers.pointer4.compute() = thing2'
  )
  t.equals(
    master.get([ 'pointers', 'pointer4' ]),
    void 0,
    'master.pointers.pointer4 = void 0'
  )

  t.equals(
    branch1.get([ 'pointers', 'pointer5', 'real' ]).compute(),
    master.get([ 'deep', 'real' ]).compute(),
    'branch1.pointers.pointer5.real.compute() = master.deep.real'
  )
  t.equals(
    master.get([ 'pointers', 'pointer5' ]),
    void 0,
    'master.pointers.pointer5 = void 0'
  )

  const branch2 = branch1.create({
    deep: {
      real: 'override'
    },
    pointers: {
      pointer1: {
        real: 'reference-override'
      }
    }
  })

  t.equals(
    master.get([ 'deep', 'real' ]).compute(),
    'thing',
    'master.deep.real.compute() = thing'
  )
  t.equals(
    branch1.get([ 'deep', 'real' ]).compute(),
    'thing',
    'branch1.deep.real.compute() = thing'
  )
  t.equals(
    branch2.get([ 'deep', 'real' ]).compute(),
    'override',
    'branch2.deep.real.compute() = override'
  )
  t.equals(
    branch2.get([ 'deep', 'real2' ]).compute(),
    'thing2',
    'branch2.deep.real2.compute() = thing2'
  )

  t.equals(
    branch2.get([ 'pointers', 'pointer1', 'real' ]).compute(),
    'reference-override',
    'branch2.pointers.pointer1.real.compute() = reference-override'
  )
  t.equals(
    branch2.get([ 'pointers', 'pointer2' ]).compute(),
    'override',
    'branch2.pointers.pointer2.compute() = override'
  )
  t.equals(
    branch2.get([ 'pointers', 'pointer3' ]).compute(),
    'override',
    'branch2.pointers.pointer3.compute() = override'
  )
  t.equals(
    branch2.get([ 'pointers', 'pointer4' ]).compute(),
    'thing2',
    'branch2.pointers.pointer4.compute() = thing2'
  )
  t.equals(
    branch2.get([ 'pointers', 'pointer5', 'real2' ]).compute(),
    'thing2',
    'branch2.pointers.pointer5.real2.compute() = thing2'
  )
  t.equals(
    branch2.get([ 'pointers', 'pointer5' ]).get('real2').compute(),
    'thing2',
    'branch2.pointers.pointer5.real2.compute() = thing2'
  )

  branch1.set({
    pointers: {
      pointer1: 'override'
    }
  })

  t.equals(
    branch2.get([ 'pointers', 'pointer5', 'real' ]).compute(),
    'reference-override',
    'branch2.pointers.pointer5.real = reference-override'
  )
  t.equals(
    branch2.get([ 'pointers', 'pointer1', 'real2' ]),
    void 0,
    'branch2.pointers.pointer1.real2 = undefined'
  )
  t.equals(
    branch2.get([ 'pointers', 'pointer5' ]).get('real2'),
    void 0,
    'branch2.pointers.pointer5.real2 = undefined'
  )
  t.equals(
    branch2.get([ 'pointers', 'pointer1' ]).compute(),
    'override',
    'branch2.pointers.pointer1.compute() = override'
  )
  t.equals(
    branch2.get([ 'pointers', 'pointer5' ]).compute(),
    'override',
    'branch2.pointers.pointer5.compute() = override'
  )

  t.end()
})
